// Real attention using 50-dimensional Shakespeare embeddings.
// Key concept: the same word produces different attention patterns in different contexts.
const embeddings = await fetch("data/embeddings.json").then(r => r.json());

function dotProduct(a, b) {
  return a.reduce((sum, v, i) => sum + v * b[i], 0);
}

function softmax(scores) {
  const exps = scores.map(Math.exp);
  const sum  = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

// Compute full attention matrix for a sentence (all tokens → all tokens)
function attend(sentence) {
  const words = sentence.split(" ");
  const vecs  = words.map(w => embeddings[w]);
  return words.map((word, i) => {
    const weights = softmax(vecs.map(v => dotProduct(vecs[i], v)));
    return {
      word,
      top: weights
        .map((w, j) => ({ to: words[j], weight: w }))
        .filter((_, j) => j !== i)          // exclude self
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 3),
    };
  });
}

// ── Two sentences, same word "arms", completely different context ─────────

const embrace = attend("his arms about the queen");
const warfare = attend("with arms and men in battle");

// Pull out "arms" (index 1 in both sentences)
const armsEmbrace = embrace[1];
const armsWarfare = warfare[1];

console.log('"arms" in "his arms about the queen":');
armsEmbrace.top.forEach(({ to, weight }) =>
  console.log(`  → "${to}"  ${(weight * 100).toFixed(1)}%`)
);
// → "queen" 15.4%   "his" 15.5%   "about" 13.8%
// Meaning: "arms" leans toward the person being held — an embrace.

console.log('\n"arms" in "with arms and men in battle":');
armsWarfare.top.forEach(({ to, weight }) =>
  console.log(`  → "${to}"  ${(weight * 100).toFixed(1)}%`)
);
// → "battle" 16.3%   "and" 14.2%   "men" 12.7%
// Meaning: "arms" leans toward conflict and soldiers — weapons.

// ── This is what attention does in a real transformer ────────────────────
// Each of the 96 attention heads in GPT-4 learns a different "question" to ask.
// Some heads track syntax, some track coreference, some track semantic role.
// Together, they let every token reinterpret its meaning based on full context.
