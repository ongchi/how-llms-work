# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

This repository contains preparation materials for a talk titled **"How AI Works"** — aimed at developers, using simple JavaScript examples to explain LLM internals from first principles.

## Files

- `How AI Works.md` — raw bullet-point notes covering the key topics (source outline)
- `Talk Summary.md` — structured talk summary describing each section and its interactive demo
- `The Complete Works of William Shakespeare.txt` — reference corpus (used as example training data in demos)

## Talk Structure

The talk (`Talk Summary.md`) follows this progression:

1. LLMs as autocomplete (frequency-table next-char predictor)
2. Tokenization (text → integer IDs)
3. Embeddings (token IDs → vectors, cosine similarity)
4. Attention mechanism (dot-product attention, softmax weights)
5. Full Transformer loop (logits → softmax → sampling)
6. Training (gradient descent toy, self-supervised learning, RLHF)
7. Beyond text (CNN convolution, multimodal, diffusion)
8. Conclusion (developer takeaways + credits)

## JavaScript Examples

Each section's code lives in `examples/` as a standalone runnable file:

| File | Section |
|---|---|
| `examples/01-introduction.js` | Bigram model trained on Shakespeare |
| `examples/02-tokens.js` | Tokenizer + vocab builder |
| `examples/03-embeddings.js` | Cosine similarity + word analogy on real 50D Shakespeare embeddings |
| `examples/04-attention.js` | Dot-product attention with softmax |
| `examples/05-transformer-loop.js` | Logits → softmax → sampling |
| `examples/06-training.js` | Gradient descent toy |
| `examples/07-cnn.js` | Edge-detection convolution |

Scripts are self-contained and runnable in a browser console. They are intentionally simplified for illustration, not production use.

## Build

`Talk Summary.md` uses `<!-- @include examples/XX-name.js -->` directives instead of inline code blocks. Run the build to produce `dist/Talk Summary.md` with all includes expanded into fenced code blocks:

```sh
npm run build
# or: node build.js
```

To regenerate all prebuilt data (~15s total):

```sh
npm run build:data
# or individually:
node scripts/build-trigrams.mjs    # → data/trigrams.json        (3.6 MB, ~1s)
node scripts/build-embeddings.mjs  # → data/embeddings.json      (1000 words × 50 dims, ~10s)
                                   # → data/embeddings-sample.json (27 curated words)
```

`data/trigrams.json` — word-level trigram model (55K contexts, minCount=3, top-15 next-words each). Used by `examples/05-transformer-loop.js` to avoid reprocessing the corpus on every page load.

`data/embeddings.json` — built via PPMI co-occurrence + truncated SVD (simultaneous power iteration + Jacobi eigendecomposition). No external dependencies.

## Serving the Presentation

Open `index.html` in a browser via a local server (required for `fetch()` calls to `data/`):

```sh
npx serve .        # or: python3 -m http.server 8080
# open http://localhost:3000
```

Navigate with **arrow keys** or **spacebar**. The presentation has 19 slides.

## Presentation Framework

The presentation uses **[reveal.js](https://revealjs.com/)** — a standard slide deck framework. No build step required; reveal.js is loaded from CDN.

**How it works:** Each slide is a `<section>` element inside `.reveal > .slides`. Content is wrapped in `<div class="content">` for consistent vertical flow. Code blocks use `<pre><code class="language-javascript" data-trim>` for syntax highlighting.

**Loaded from CDN:**
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.css">
<script src="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.js"></script>
```

**Custom styles:** `revealjs-styles.css` — light GitHub theme with all custom components (tag pills, insight boxes, attention comparison, pipeline steps, layer table, overview grid, run buttons).

**Slide count:** 20 slides — title, 7× concept+demo pairs, training concept, beyond-text concept, developer takeaways, closing, credits.

**Syntax highlighting:** highlight.js via CDN with the GitHub theme (`github.min.css`), initialized via `hljs.highlightAll()` on `Reveal.on('ready', ...)`.

**Interactive demos:** Sections 1–5 each have a live demo slide. Demos are triggered via `slidechanged` and lazy-load their data on first visit:

| Section | Demo | Data |
|---|---|---|
| 01 | Character bigram graph + text generator | `data/bigrams.json` |
| 02 | Live tokenizer with colour-coded chips | `data/tokenizer.json` |
| 03 | Cosine similarity bars + word analogy | `data/embeddings.json` |
| 04 | Click-a-word attention bars | `data/embeddings.json` (shared) |
| 05 | Temperature slider + next-word generator | `data/trigrams.json` |

## Keeping `index.html` and `Talk Summary.md` in sync

These two files describe the same talk. **When you modify one, update the other:**

- Changes to slide content (concept bullets, demo descriptions, section titles) → reflect in the corresponding section of `Talk Summary.md`
- Changes to `Talk Summary.md` narrative or key insights → verify the matching slide in `index.html` is consistent
