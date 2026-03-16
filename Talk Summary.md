# How AI Works — Talk Summary

**Audience:** Developers and technically curious people
**Format:** Concept explanation + runnable JavaScript snippet per section
**Goal:** Demystify LLMs by building intuition from first principles

---

## 1. Introduction — AI is Autocomplete at Scale

Modern AI (LLMs like ChatGPT, Claude, Gemini) is fundamentally a very sophisticated next-token 
predictor. Given everything said so far, what word comes next? That's it.

Most people interact with an **LLM wrapper** — not the model directly.
The wrapper adds tricks: it formats a system prompt, maintains chat history,
and can call external tools (weather API, calculator, web search) to augment the raw model output.

<!-- @include examples/01-introduction.js -->

> **Key insight:** Trained on 5.5M characters, this model learned that `q` is always followed by 
`u`, and that `th` almost always precedes `e` — purely from counting.
Scale this to billions of parameters and trillions of words, and you get GPT-4.

---

## 2. Tokens — How AI Reads Text

LLMs don't read raw characters. They split text into **tokens** — common words or word fragments —
and assign each one a numeric ID. This keeps the vocabulary manageable:
Shakespeare's complete works (5.5M characters) compress down to just **25,900 unique tokens**.

`"To be or not to be, that is the question"` → `[51, 230, 36, 47, 51, 230, 83, 10, 0, 686]`

<!-- @include examples/02-tokens.js -->

> **Key insight:** The model sees a stream of integers, never raw text. Token IDs are just indices into a lookup table — and the same word always gets the same ID, no matter where it appears.

---

## 3. Embeddings — Meaning as Numbers

Each token ID maps to an **embedding**: a vector of 50–1,000 floating-point numbers encoding meaning.
Words used in similar contexts end up with similar vectors — they cluster together in high-dimensional space.

These embeddings were computed from Shakespeare using **PPMI co-occurrence + SVD**: count which words
appear near each other, weight by statistical surprise (PPMI), then compress to 50 dimensions.
No human labels. Pure counting.

<!-- @include examples/03-embeddings.js -->

> **Key insight:** `night ↔ day` scores 0.752 — the model learned they're related purely because
> Shakespeare always uses them in the same kinds of sentences.
> `father − man + woman` returns `[wife, daughter, mother]` — all female family members —
> because it learned gender and family structure from context alone.

---

## 4. Attention — Context Changes Meaning

Shakespeare uses "arms" in two very different senses:
- *"his **arms** about the queen"* — an embrace
- *"with **arms** and men in battle"* — weapons

Static embeddings assign "arms" one fixed vector. But the meaning depends on the surrounding words.
The **attention mechanism** lets each token score every other token and pull in a weighted blend
of their embeddings — effectively asking *"given my current context, who should I listen to?"*

<!-- @include examples/04-attention.js -->

> **Key insight:** In the first sentence "arms" pays most attention to "queen" — it's an embrace.
> In the second, it pays most attention to "battle" — it's weapons.
> Same word. Same initial embedding. Completely different contextualised meaning.
> This is what the 96 attention heads in GPT-4 are doing at every layer, for every token.

---

## 5. Putting It Together — The Transformer Loop

Each of the previous sections is one stage of the same pipeline:

```
"to be or not to be, that is the ___"
  → Tokenize   (section 2) → [51, 230, 36, 47, 51, 230, 83, 10, 0, ...]
  → Embed      (section 3) → 50-dimensional vectors per token
  → Attend     (section 4) → context-aware vectors
  → Logits                 → raw scores over the whole vocabulary
  → Softmax(T)             → probability distribution
  → Sample                 → next token
  → repeat
```

The **temperature** parameter scales the logits before softmax.
Low temperature sharpens the distribution (predictable); high temperature flattens it (creative).

<!-- @include examples/05-transformer-loop.js -->

> **Key insight:** At temperature 0.3 the model almost always completes with *"that is the matter"* —
> Shakespeare's actual line from Hamlet. At temperature 2.0 it picks rare, surprising words.
> This single knob is how you tune a model from a deterministic tool to a creative collaborator.

---

## 6. Training — How Models Learn

A model starts with random weights.
Training adjusts those weights so it gets better at next-token prediction.

**Self-supervised learning:** The training data is the entire internet.
For every sentence, mask the last word and ask the model to predict it.
No human labels needed — the correct answer is already in the text.

**RLHF (Reinforcement Learning from Human Feedback):** After pre-training,
human raters score model responses. A separate "reward model" learns their preferences,
then the LLM is fine-tuned to maximize that reward — making it helpful, harmless, and honest.

<!-- @include examples/06-training.js -->

> **Key insight:** Real training runs this loop billions of times, across billions of parameters, on thousands of GPUs. Same math, vastly bigger scale.

---

## 7. Beyond Text — CNNs, Multimodal AI, and Diffusion

**Convolutional Neural Networks (CNNs)** are the standard for image understanding.
Instead of attention across tokens, they slide small filter kernels across pixels
to detect edges, shapes, and textures.

**Multimodal AI** (GPT-4o, Gemini, Claude) combines a vision encoder (CNN or ViT) with a
language model so the system can reason about both text and images.

**Diffusion models** (Stable Diffusion, DALL-E, Midjourney)
generate images by starting from pure random noise and iteratively denoising it — like
developing a photograph in reverse.

<!-- @include examples/07-cnn.js -->

> **Key insight:** A deep CNN stacks many such layers. Early layers detect edges, later layers detect eyes, faces, cars — complexity builds up automatically through training.

---

## 8. Conclusion — The Full Picture

Put it all together:

| Layer | What it does |
|---|---|
| Tokenizer | Converts text → integer IDs |
| Embedding table | Maps IDs → dense vectors (meaning) |
| Attention layers | Contextualizes each vector using all others |
| Output head | Projects to vocabulary probabilities |
| Sampler | Picks next token |
| Wrapper | Manages history, tools, system prompt |
| RLHF | Makes the whole thing helpful and safe |

**ChatGPT / Claude / Gemini = all of the above,
trained on trillions of tokens, with billions of parameters, fine-tuned with human feedback.**

### What this means for you as a developer

- **Prompt engineering is real** — the system prompt and conversation history are just more tokens. Context matters.
- **Hallucinations are features, not bugs** — the model is sampling from a distribution. It doesn't "know" facts; it predicts plausible continuations.
- **Tool use / function calling** is the wrapper giving the model a way to output structured tokens that trigger real code execution.
- **RAG (Retrieval-Augmented Generation)** just means injecting relevant documents into the context before asking the model to answer.
- **Fine-tuning** is RLHF on a smaller, domain-specific dataset — same mechanism, different data.

> **The magic isn't magic — it's matrix multiplication at scale, trained on human knowledge, guided by human feedback.**
