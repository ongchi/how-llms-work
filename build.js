#!/usr/bin/env node
// Expands <!-- @include path/to/file.js --> directives in Talk Summary.md
// Usage: node build.js
// Output: dist/Talk Summary.md (with all includes replaced by fenced code blocks)

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { extname, dirname } from "path";

const SRC = "Talk Summary.md";
const OUT = "dist/Talk Summary.md";

const INCLUDE_RE = /^<!-- @include (.+?) -->$/gm;

const src = readFileSync(SRC, "utf8");

const built = src.replace(INCLUDE_RE, (_, filePath) => {
  const code = readFileSync(filePath, "utf8").trimEnd();
  const lang = extname(filePath).slice(1); // "js", "ts", etc.
  return `\`\`\`${lang}\n${code}\n\`\`\``;
});

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, built, "utf8");
console.log(`Built → ${OUT}`);
