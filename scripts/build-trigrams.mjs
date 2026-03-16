#!/usr/bin/env node
// Builds a word-level trigram model from Shakespeare and saves it to data/.
// Keeps only bigram contexts that appear ≥ 3 times, storing the top-15 next words each.
// Usage: node scripts/build-trigrams.mjs
// Output: data/trigrams.json

import { readFileSync, writeFileSync, mkdirSync } from "fs";

const MIN_COUNT = 3;   // minimum total occurrences for a context to be kept
const TOP_N     = 15;  // maximum next-words stored per context

process.stdout.write("Tokenizing... ");
const text   = readFileSync("The Complete Works of William Shakespeare.txt", "utf8").toLowerCase();
const tokens = text.match(/\b\w+\b/g);
console.log(`${tokens.length.toLocaleString()} tokens`);

process.stdout.write("Building trigrams... ");
const model = {};
for (let i = 0; i < tokens.length - 2; i++) {
  const key = tokens[i] + " " + tokens[i + 1];
  const nxt = tokens[i + 2];
  if (!model[key]) model[key] = {};
  model[key][nxt] = (model[key][nxt] || 0) + 1;
}
console.log(`${Object.keys(model).length.toLocaleString()} unique contexts`);

process.stdout.write("Filtering and trimming... ");
const trimmed = {};
for (const [key, nexts] of Object.entries(model)) {
  const total = Object.values(nexts).reduce((s, c) => s + c, 0);
  if (total < MIN_COUNT) continue;
  trimmed[key] = Object.fromEntries(
    Object.entries(nexts).sort((a, b) => b[1] - a[1]).slice(0, TOP_N)
  );
}
const kept = Object.keys(trimmed).length;
const size = JSON.stringify(trimmed).length;
console.log(`${kept.toLocaleString()} contexts kept  (${(size / 1024 / 1024).toFixed(2)} MB)`);

mkdirSync("data", { recursive: true });
writeFileSync("data/trigrams.json", JSON.stringify(trimmed));
console.log("Saved data/trigrams.json");

// ── Sanity check ──────────────────────────────────────────────────────────
console.log("\nSample predictions:");
const checks = ["to be", "is the", "that is", "the king", "my lord"];
for (const key of checks) {
  if (!trimmed[key]) { console.log(`  "${key}": (not in data)`); continue; }
  const top3 = Object.entries(trimmed[key]).slice(0, 3).map(([w, c]) => `${w}(${c})`).join(", ");
  console.log(`  "${key}" → ${top3}`);
}
