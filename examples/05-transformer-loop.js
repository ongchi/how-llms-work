// Putting it all together: the full pipeline applied to Shakespeare.
//
// Pipeline:  prompt → tokenize → embed → attend → logits → softmax(T) → sample
//
// Sections 1-4 showed each piece in isolation. Here they run as one loop.
// The "logits" step uses a prebuilt word-level trigram model as a stand-in for
// what a real transformer computes via matrix multiplications through N layers.
// Prebuilt by: node scripts/build-trigrams.mjs  →  data/trigrams.json

const trigrams = await fetch("data/trigrams.json").then(r => r.json());

// Temperature-scaled softmax: low T = peaked, high T = flat
function softmaxTemp(counts, temperature) {
  const entries = Object.entries(counts);
  const logits  = entries.map(([, c]) => Math.log(c + 1) / temperature);
  const exps    = logits.map(Math.exp);
  const sum     = exps.reduce((a, b) => a + b, 0);
  return entries.map(([word], i) => ({ word, prob: exps[i] / sum }))
    .sort((a, b) => b.prob - a.prob);
}

function sample(probs) {
  let r = Math.random();
  for (const { word, prob } of probs) { r -= prob; if (r <= 0) return word; }
  return probs[probs.length - 1].word;
}

function generate(model, prompt, steps, temperature) {
  const words = prompt.toLowerCase().match(/\b\w+\b/g);
  for (let i = 0; i < steps; i++) {
    const key    = words[words.length - 2] + " " + words[words.length - 1];
    const counts = model[key];
    if (!counts) break;
    words.push(sample(softmaxTemp(counts, temperature)));
  }
  return words.join(" ");
}

// ── Demo ─────────────────────────────────────────────────────────────────

// Step through the pipeline for a single prediction
const prompt  = "to be or not to be that is the";
const context = "is the";               // last 2 tokens — the "context window"
const counts  = trigrams[context];      // trigram lookup ≈ transformer logits

console.log(`Prompt: "${prompt}"`);
console.log(`Context window: "${context}"\n`);

// Show distribution at three temperatures
for (const temp of [0.3, 1.0, 2.0]) {
  const top5 = softmaxTemp(counts, temp).slice(0, 5);
  console.log(`temperature=${temp}:`);
  top5.forEach(({ word, prob }) =>
    console.log(`  P("${word}") = ${(prob * 100).toFixed(1)}%`)
  );
  console.log(`  → "${generate(trigrams, prompt, 4, temp)}"\n`);
}

// temp=0.3  → almost always "...that is the matter" (Shakespeare's actual line)
// temp=1.0  → varied: king, man, duke, news, way ...
// temp=2.0  → creative/random: rare words from across the corpus
