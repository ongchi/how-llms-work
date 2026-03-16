#!/usr/bin/env node
// Builds a word-level tokenizer from Shakespeare and saves vocab to data/.
// Usage: node scripts/build-tokenizer.mjs
// Output: data/tokenizer.json  — { words: string[], topTokens: [string, number][] }

import { readFileSync, writeFileSync, mkdirSync } from "fs";

process.stdout.write("Reading corpus... ");
const text = readFileSync("The Complete Works of William Shakespeare.txt", "utf8").toLowerCase();
const tokens = text.match(/\b\w+\b/g) || [];
console.log(`${tokens.length.toLocaleString()} tokens`);

process.stdout.write("Building vocab... ");
const words = [];
const seen = new Set();
for (const token of tokens) {
  if (!seen.has(token)) { seen.add(token); words.push(token); }
}
console.log(`${words.length.toLocaleString()} unique words`);

process.stdout.write("Computing frequencies... ");
const freq = tokens.reduce((f, t) => { f[t] = (f[t] || 0) + 1; return f; }, {});
const topTokens = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5);
console.log(`top: ${topTokens.map(([w, c]) => `${w}(${c})`).join(", ")}`);

mkdirSync("data", { recursive: true });
const out = JSON.stringify({ words, topTokens });
writeFileSync("data/tokenizer.json", out);
console.log(`Saved data/tokenizer.json  (${(out.length / 1024).toFixed(0)} KB)`);
