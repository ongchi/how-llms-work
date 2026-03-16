#!/usr/bin/env node
// Builds word embeddings from Shakespeare via PPMI co-occurrence + truncated SVD.
// Output: data/embeddings.json        (top 1000 words × 50 dims)
//         data/embeddings-sample.json (subset of interesting words)
// Usage: node scripts/build-embeddings.mjs

import { readFileSync, writeFileSync, mkdirSync } from "fs";

const VOCAB_SIZE  = 1000;
const WINDOW      = 5;     // co-occurrence window radius
const DIM         = 50;    // embedding dimensions
const POWER_ITERS = 5;     // randomized SVD power iterations

// ── Matrix helpers (flat row-major Float64Array) ──────────────────────────

/** A(m×k) @ B(k×n) → C(m×n) */
function mmul(A, m, k, B, n) {
  const C = new Float64Array(m * n);
  for (let i = 0; i < m; i++)
    for (let p = 0; p < k; p++) {
      const a = A[i * k + p];
      if (a === 0) continue;
      for (let j = 0; j < n; j++) C[i * n + j] += a * B[p * n + j];
    }
  return C;
}

/** A(m×n) → Aᵀ(n×m) */
function tr(A, m, n) {
  const At = new Float64Array(n * m);
  for (let i = 0; i < m; i++)
    for (let j = 0; j < n; j++) At[j * m + i] = A[i * n + j];
  return At;
}

/** Gram-Schmidt orthonormalization of columns of A(m×n) */
function gs(A, m, n) {
  const Q = A.slice();
  for (let j = 0; j < n; j++) {
    for (let p = 0; p < j; p++) {
      let dot = 0;
      for (let i = 0; i < m; i++) dot += Q[i * n + j] * Q[i * n + p];
      for (let i = 0; i < m; i++) Q[i * n + j] -= dot * Q[i * n + p];
    }
    let norm = 0;
    for (let i = 0; i < m; i++) norm += Q[i * n + j] ** 2;
    norm = Math.sqrt(norm);
    for (let i = 0; i < m; i++) Q[i * n + j] /= norm || 1;
  }
  return Q;
}

/** Jacobi eigendecomposition for symmetric n×n matrix.
 *  Returns { vecs: Float64Array(n×n col-major eigvecs), vals: number[] }
 *  sorted by descending eigenvalue. */
function jacobiEig(M, n) {
  const a = M.slice();
  const V = new Float64Array(n * n);
  for (let i = 0; i < n; i++) V[i * n + i] = 1;

  for (let sweep = 0; sweep < 100; sweep++) {
    let maxOff = 0;
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++)
        if (Math.abs(a[i * n + j]) > maxOff) maxOff = Math.abs(a[i * n + j]);
    if (maxOff < 1e-14) break;

    for (let p = 0; p < n - 1; p++) {
      for (let q = p + 1; q < n; q++) {
        const apq = a[p * n + q];
        if (Math.abs(apq) < 1e-14) continue;
        const tau = (a[q * n + q] - a[p * n + p]) / (2 * apq);
        const t   = Math.sign(tau) / (Math.abs(tau) + Math.sqrt(1 + tau * tau));
        const c   = 1 / Math.sqrt(1 + t * t);
        const s   = t * c;
        a[p * n + p] -= t * apq;
        a[q * n + q] += t * apq;
        a[p * n + q] = a[q * n + p] = 0;
        for (let r = 0; r < n; r++) {
          if (r === p || r === q) continue;
          const arp = a[r * n + p], arq = a[r * n + q];
          a[r * n + p] = a[p * n + r] = c * arp - s * arq;
          a[r * n + q] = a[q * n + r] = s * arp + c * arq;
        }
        for (let r = 0; r < n; r++) {
          const vrp = V[r * n + p], vrq = V[r * n + q];
          V[r * n + p] = c * vrp - s * vrq;
          V[r * n + q] = s * vrp + c * vrq;
        }
      }
    }
  }

  const order = Array.from({ length: n }, (_, i) => [a[i * n + i], i])
    .sort((a, b) => b[0] - a[0]);
  const vals = order.map(([v]) => v);
  const vecs = new Float64Array(n * n);
  for (let j = 0; j < n; j++) {
    const src = order[j][1];
    for (let i = 0; i < n; i++) vecs[i * n + j] = V[i * n + src];
  }
  return { vecs, vals };
}

// ── 1. Tokenize ───────────────────────────────────────────────────────────
process.stdout.write("Tokenizing... ");
const text   = readFileSync("The Complete Works of William Shakespeare.txt", "utf8");
const tokens = text.toLowerCase().match(/\b\w+\b/g) || [];
console.log(`${tokens.length.toLocaleString()} tokens`);

// ── 2. Vocabulary: top N words by frequency ───────────────────────────────
const freq = {};
for (const t of tokens) freq[t] = (freq[t] || 0) + 1;
const vocab = Object.entries(freq)
  .sort((a, b) => b[1] - a[1])
  .slice(0, VOCAB_SIZE)
  .map(([w]) => w);
const w2i = Object.fromEntries(vocab.map((w, i) => [w, i]));
const N   = vocab.length;
console.log(`Vocabulary: ${N} words`);

// ── 3. Co-occurrence matrix (distance-weighted, symmetric) ────────────────
process.stdout.write("Building co-occurrence matrix... ");
const cooc = new Float64Array(N * N);
for (let i = 0; i < tokens.length; i++) {
  const ci = w2i[tokens[i]];
  if (ci === undefined) continue;
  for (let d = 1; d <= WINDOW; d++) {
    if (i + d < tokens.length) {
      const cj = w2i[tokens[i + d]];
      if (cj !== undefined) {
        cooc[ci * N + cj] += 1 / d;
        cooc[cj * N + ci] += 1 / d;
      }
    }
  }
}
console.log("done");

// ── 4. PPMI weighting ─────────────────────────────────────────────────────
process.stdout.write("Applying PPMI... ");
const rowSum = new Float64Array(N);
let total = 0;
for (let i = 0; i < N; i++)
  for (let j = 0; j < N; j++) { rowSum[i] += cooc[i * N + j]; total += cooc[i * N + j]; }

const ppmi = new Float64Array(N * N);
for (let i = 0; i < N; i++)
  for (let j = 0; j < N; j++) {
    const c = cooc[i * N + j];
    if (c === 0 || rowSum[i] === 0 || rowSum[j] === 0) continue;
    const pmi = Math.log((c * total) / (rowSum[i] * rowSum[j]));
    ppmi[i * N + j] = Math.max(0, pmi);
  }
console.log("done");

// ── 5. Truncated SVD via simultaneous power iteration ────────────────────
// For symmetric PPMI, SVD reduces to eigendecomposition.
// Algorithm: random Q → power-iterate Q = PPMI @ Q → Rayleigh-Ritz → Jacobi eig.
console.log(`Computing top-${DIM} eigenvectors (${POWER_ITERS} iterations)...`);

let Q = new Float64Array(N * DIM);
for (let i = 0; i < N * DIM; i++) Q[i] = Math.random() - 0.5;
Q = gs(Q, N, DIM);

for (let iter = 0; iter < POWER_ITERS; iter++) {
  process.stdout.write(`  power iter ${iter + 1}/${POWER_ITERS}...\r`);
  Q = mmul(ppmi, N, N, Q, DIM);
  Q = gs(Q, N, DIM);
}
console.log("  power iterations done   ");

// Rayleigh-Ritz: T = Qᵀ PPMI Q  (DIM×DIM), then eigendecompose T
const T = mmul(tr(Q, N, DIM), DIM, N, mmul(ppmi, N, N, Q, DIM), DIM);
const { vecs: eigVecs } = jacobiEig(T, DIM);

// Final embeddings: E = Q @ eigVecs  (N×DIM), then L2-normalize rows
const E = mmul(Q, N, DIM, eigVecs, DIM);
for (let i = 0; i < N; i++) {
  let norm = 0;
  for (let j = 0; j < DIM; j++) norm += E[i * DIM + j] ** 2;
  norm = Math.sqrt(norm);
  for (let j = 0; j < DIM; j++) E[i * DIM + j] /= norm || 1;
}
console.log("Embeddings computed");

// ── 6. Save full embeddings ───────────────────────────────────────────────
mkdirSync("data", { recursive: true });
const all = {};
for (let i = 0; i < N; i++)
  all[vocab[i]] = Array.from(E.subarray(i * DIM, (i + 1) * DIM));

writeFileSync("data/embeddings.json", JSON.stringify(all));
console.log(`Saved data/embeddings.json  (${N} words × ${DIM} dims)`);

// ── 7. Extract sample subset ──────────────────────────────────────────────
const SAMPLE_WORDS = [
  // royalty
  "king", "queen", "prince", "lord", "lady", "crown", "throne",
  // people
  "man", "woman", "father", "mother", "son", "daughter", "soldier",
  // emotion / morality
  "love", "hate", "fear", "honour", "shame", "mercy", "death",
  // nature / time
  "night", "day", "sword", "heart", "blood", "god", "devil",
];

const sample = {};
const missing = [];
for (const w of SAMPLE_WORDS) {
  if (all[w]) sample[w] = all[w];
  else missing.push(w);
}
if (missing.length) console.warn(`  Not in vocab: ${missing.join(", ")}`);

writeFileSync("data/embeddings-sample.json", JSON.stringify(sample, null, 2));
console.log(`Saved data/embeddings-sample.json  (${Object.keys(sample).length} words)`);

// ── 8. Sanity check ───────────────────────────────────────────────────────
const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0); // unit vecs

console.log("\nCosine similarities:");
const pairs = [
  ["king",  "queen"],  ["king",  "lord"],   ["king",  "crown"],
  ["man",   "woman"],  ["love",  "hate"],   ["night", "day"],
  ["sword", "blood"],  ["king",  "sword"],
];
for (const [a, b] of pairs)
  if (all[a] && all[b])
    console.log(`  ${a.padEnd(8)} ↔ ${b.padEnd(8)}: ${dot(all[a], all[b]).toFixed(3)}`);

console.log("\nWord analogies (a − b + c ≈ ?):");
function analogy(a, b, c) {
  if (!all[a] || !all[b] || !all[c]) return "N/A (word not in vocab)";
  const q = all[a].map((v, i) => v - all[b][i] + all[c][i]);
  const norm = Math.sqrt(q.reduce((s, v) => s + v * v, 0));
  const qn = q.map(v => v / norm);
  const skip = new Set([a, b, c]);
  let best = "", bestSim = -Infinity;
  for (const [w, vec] of Object.entries(all)) {
    if (skip.has(w)) continue;
    const sim = dot(qn, vec);
    if (sim > bestSim) { bestSim = sim; best = w; }
  }
  return `${best}  (sim=${bestSim.toFixed(3)})`;
}

const analogies = [
  ["king",   "man",   "woman"],
  ["father", "man",   "woman"],
  ["lord",   "man",   "woman"],
  ["night",  "dark",  "light"],
];
for (const [a, b, c] of analogies)
  console.log(`  ${a} − ${b} + ${c} ≈ ${analogy(a, b, c)}`);
