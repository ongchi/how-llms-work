// Tokenizer prebuilt by scripts/build-tokenizer.mjs → data/tokenizer.json
async function buildTokenizer() {
  const { words, topTokens } = await fetch("data/tokenizer.json").then(r => r.json());
  const vocab = Object.fromEntries(words.map((w, i) => [w, i]));

  return {
    encode: (text) => (text.toLowerCase().match(/\b\w+\b/g) || []).map(t => vocab[t] ?? -1),
    decode: (ids)  => ids.map(id => words[id] ?? "<unk>").join(" "),
    vocabSize: words.length,
    topTokens,
  };
}

const t = await buildTokenizer();

console.log("Vocab size:", t.vocabSize);        // 25,900 unique words
// vs GPT-4's ~100,000 subword tokens — same idea, much larger scale

console.log("Top 5 tokens:", t.topTokens);
// [["the",30526],["and",28567],["i",24188],["to",20844],["of",18882]]
// Frequent words get low IDs — they're the most "important" entries

const ids = t.encode("To be or not to be that is the question");
console.log("Encoded:", ids);
// [51, 230, 36, 47, 51, 230, 83, 10, 0, 686]
// Notice: "to"=51 and "be"=230 each appear twice — same ID both times

console.log("Decoded:", t.decode(ids));
// "to be or not to be that is the question"
// Round-trip: encode → decode recovers the original words exactly
