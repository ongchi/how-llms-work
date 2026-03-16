// Character bigram model prebuilt from The Complete Works of Shakespeare.
// Built via scripts/build-bigrams.mjs → data/bigrams.json
const model = await fetch("data/bigrams.json").then(r => r.json());

function predictGreedy(model, char) {
  const counts = model[char];
  if (!counts) return "?";
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function sample(model, char) {
  const counts = model[char];
  const entries = Object.entries(counts);
  const total = entries.reduce((s, [, c]) => s + c, 0);
  let r = Math.random() * total;
  for (const [next, cnt] of entries) { r -= cnt; if (r <= 0) return next; }
}

function generate(model, start, length, strategy) {
  let out = start;
  for (let i = 0; i < length; i++) out += strategy(model, out[out.length - 1]);
  return out;
}

// What follows 't' in Shakespeare? 34.5% → 'h', 22.1% → ' ', 9.1% → 'o'
// What follows 'q'? 100% → 'u'  (the model learned English spelling rules!)

console.log(generate(model, "t", 40, predictGreedy));
// "the the the the the the the the the the t"
// Greedy gets stuck — always picks the single most likely character

console.log(generate(model, "t", 60, sample));
// "thou hast not so much brain as ear-wax, go"
// Sampling produces varied, Shakespeare-flavoured text
