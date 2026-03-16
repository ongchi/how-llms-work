#!/usr/bin/env node
// Builds a character-level bigram model from Shakespeare and saves it to data/.
// Usage: node scripts/build-bigrams.mjs
// Output: data/bigrams.json

import { readFileSync, writeFileSync, mkdirSync } from "fs";

process.stdout.write("Reading corpus... ");
const raw = readFileSync("The Complete Works of William Shakespeare.txt", "utf8");
// Strip Project Gutenberg header/footer — keep only Shakespeare's actual text
const start = raw.indexOf("*** START OF THE PROJECT GUTENBERG EBOOK");
const end   = raw.indexOf("*** END OF THE PROJECT GUTENBERG EBOOK");
const shakespeare = raw.slice(raw.indexOf("\n", start) + 1, end);
// Normalise: line endings → space, strip Gutenberg markup (_italics_, [brackets]),
// keep only letters + common punctuation so generated text is clean and continuous
const text = shakespeare
  .replace(/\r?\n/g, " ")
  .replace(/_([^_]+)_/g, "$1")  // _italic_ → italic
  .replace(/\[[^\]]*\]/g, " ")  // [stage dir] → space
  .replace(/[^a-zA-Z '.,!?;:\-]/g, "")
  .replace(/ {2,}/g, " ")
  .toLowerCase();
console.log(`${text.length.toLocaleString()} characters`);

process.stdout.write("Building bigrams... ");
const model = {};
for (let i = 0; i < text.length - 1; i++) {
  const char = text[i], next = text[i + 1];
  if (!model[char]) model[char] = {};
  model[char][next] = (model[char][next] || 0) + 1;
}
console.log(`${Object.keys(model).length} unique characters`);

mkdirSync("data", { recursive: true });
writeFileSync("data/bigrams.json", JSON.stringify(model));
const size = JSON.stringify(model).length;
console.log(`Saved data/bigrams.json  (${(size / 1024).toFixed(0)} KB)`);

// Sanity check
const th = model["t"];
const top3 = Object.entries(th).sort((a, b) => b[1] - a[1]).slice(0, 3);
const total = Object.values(th).reduce((s, c) => s + c, 0);
console.log("\nAfter 't':");
for (const [ch, cnt] of top3) {
  console.log(`  '${ch}' ${((cnt / total) * 100).toFixed(1)}%`);
}
