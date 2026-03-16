// Real 50-dimensional word embeddings learned from The Complete Works of Shakespeare.
// Built via PPMI co-occurrence matrix + truncated SVD (scripts/build-embeddings.mjs).
// Each word is represented as a unit vector in 50-dimensional space.
const embeddings = await fetch("data/embeddings-sample.json").then(r => r.json());

function cosineSimilarity(a, b) {
  // Vectors are already L2-normalised, so dot product = cosine similarity
  return a.reduce((sum, v, i) => sum + v * b[i], 0);
}

const sim = (a, b) => cosineSimilarity(embeddings[a], embeddings[b]).toFixed(3);

// ── Similarity: related words cluster in space ────────────────────────────
console.log("Cosine similarities learned from Shakespeare:");
console.log(`  night   ↔ day     : ${sim("night",  "day")}`);    // 0.752 — always in contrast
console.log(`  father  ↔ mother  : ${sim("father", "mother")}`); // 0.611 — both parents
console.log(`  king    ↔ queen   : ${sim("king",   "queen")}`);  // 0.570 — both royalty
console.log(`  man     ↔ woman   : ${sim("man",    "woman")}`);  // 0.518
console.log(`  love    ↔ hate    : ${sim("love",   "hate")}`);   // 0.441 — opposites co-occur!
console.log(`  king    ↔ sword   : ${sim("king",   "sword")}`);  // ~0.00 — unrelated topics

// ── Word arithmetic: king − man + woman ≈ ? ──────────────────────────────
function analogy(a, b, c, topN = 3) {
  const query = embeddings[a].map((v, i) => v - embeddings[b][i] + embeddings[c][i]);
  const norm  = Math.sqrt(query.reduce((s, v) => s + v * v, 0));
  const qNorm = query.map(v => v / norm);

  return Object.entries(embeddings)
    .filter(([w]) => w !== a && w !== b && w !== c)
    .map(([w, vec]) => [w, cosineSimilarity(qNorm, vec)])
    .sort((x, y) => y[1] - x[1])
    .slice(0, topN)
    .map(([w, s]) => `${w}(${s.toFixed(2)})`);
}

console.log("\nWord arithmetic:");
console.log("  king − man + woman  ≈", analogy("king",   "man", "woman").join(", "));
// → richard(0.54), henry(0.52), queen(0.44)
// Both richard and henry are kings in Shakespeare — the model learned that.
// "queen" still appears in the top 3: the geometry is real.

console.log("  father − man + woman ≈", analogy("father", "man", "woman").join(", "));
// → wife(0.52), daughter(0.49), mother(0.46)
// All female family members — nobody told it that. It learned from context.
