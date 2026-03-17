# How AI Works — Talk Summary

**Audience:** Developers and technically curious people
**Format:** Concept explanation + interactive browser demo per section
**Goal:** Demystify LLMs by building intuition from first principles

---

## 1. Introduction — AI is Autocomplete at Scale

Modern AI (LLMs like ChatGPT, Claude, Gemini) is fundamentally a very sophisticated next-token
predictor. Given everything said so far, what word comes next? That's it.

Most people interact with an **LLM wrapper** — not the model directly.
The wrapper adds tricks: it formats a system prompt, maintains chat history,
and can call external tools (weather API, calculator, web search) to augment the raw model output.

**Demo:** Character bigram model trained on 5.5M characters of Shakespeare.
Pick a start character, choose sample or greedy strategy, and watch it generate text.
An interactive graph shows the top-3 transitions from each character; click any node to start there.

> **Key insight:** Trained on 5.5M characters, this model learned that `q` is always followed by
`u`, and that `th` almost always precedes `e` — purely from counting.
Scale this to billions of parameters and trillions of words, and you get GPT-4.

---

## 2. Tokens — How AI Reads Text

LLMs don't read raw characters. They split text into **tokens** — common words or word fragments —
and assign each one a numeric ID. This keeps the vocabulary manageable:
Shakespeare's complete works (5.5M characters) compress down to just **25,900 unique tokens**.

`"To be or not to be, that is the question"` → `[51, 230, 36, 47, 51, 230, 83, 10, 0, 686]`

**Demo:** Live tokenizer playground. Type any text and watch it split into colour-coded token chips
in real time. Each chip's background colour is determined by its vocabulary ID; unknown words
(not in Shakespeare's top-25,900) appear in red. The encoded ID array and token count are shown below.
Preset buttons load the Hamlet quote, a pangram, and a word outside the vocabulary.

> **Key insight:** The model sees a stream of integers, never raw text. Token IDs are just indices
> into a lookup table — and the same word always gets the same ID, no matter where it appears.

---

## 3. Embeddings — Meaning as Numbers

Each token ID maps to an **embedding**: a vector of 50 floating-point numbers encoding meaning.
Words used in similar contexts end up with similar vectors — they cluster together in high-dimensional space.

These embeddings were computed from Shakespeare using **PPMI co-occurrence + SVD**: count which words
appear near each other, weight by statistical surprise (PPMI), then compress to 50 dimensions.
No human labels. Pure counting.

**Demo:** Interactive embedding explorer over the full 1,000-word Shakespeare vocabulary.
Select any word from the dropdown to see animated cosine-similarity bars for the 8 nearest words.
Below, a word-arithmetic row computes `A − B + C ≈ ?` live — change any of the three selects
and the top-3 results update instantly as styled chips.

> **Key insight:** `night ↔ day` scores 0.752 — the model learned they're related purely because
> Shakespeare always uses them in the same kinds of sentences.
> `king − man + woman` returns results including `queen` — because it learned gender and semantic
> roles from context alone, with no human labels.

---

## 4. Attention — Context Changes Meaning

Shakespeare uses "arms" in two very different senses:
- *"his **arms** about the queen"* — an embrace
- *"with **arms** and men in battle"* — weapons

Static embeddings assign "arms" one fixed vector. But the meaning depends on the surrounding words.
The **attention mechanism** lets each token score every other token and pull in a weighted blend
of their embeddings — effectively asking *"given my current context, who should I listen to?"*

**Demo:** Type any sentence (words from the 1,000-word Shakespeare embedding vocab) or pick a
preset (embrace / battle / royalty). Click any word chip to see animated attention bars showing
the dot-product attention weights from that word to every other token in the sentence.
Unknown words appear greyed out.

> **Key insight:** In the embrace sentence "arms" pays most attention to `the` (16.8%), `his` (15.5%),
> `queen` (15.4%). In the battle sentence it pays most attention to `battle` (16.3%), `and` (14.2%),
> `men` (12.7%). Same word. Same initial embedding. Completely different contextualised meaning.
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

**Demo:** Live temperature playground driven by a Shakespeare word-trigram model.
Edit the prompt textarea or press `+ next word` to sample and append the next token.
The temperature slider (0.1–2.5) instantly redraws the top-8 next-word probability bars,
making the peaked-vs-flat effect visible. `Reset` returns to the Hamlet quote.

> **Key insight:** At low temperature the model almost always completes with *"that is the matter"* —
> Shakespeare's actual line from Hamlet. At high temperature it picks rare, surprising words.
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

> **Key insight:** Real training runs this loop billions of times, across billions of parameters,
> on thousands of GPUs. Same math, vastly bigger scale.

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

> **Key insight:** A deep CNN stacks many such layers. Early layers detect edges, later layers
> detect eyes, faces, cars — complexity builds up automatically through training.

---

## 8. AI Agents — From Model to Agent

An **agent** is a while loop around the transformer. The model itself hasn't changed —
what's new is the harness that runs it repeatedly and routes its outputs to real actions.

**Three building blocks:**

- **Tools** — the model emits structured tokens (`{"tool":"search","args":{...}}`); your code
  executes the tool and injects the result back into the context as new tokens.
- **Memory** — the context window is short-term memory; long-term memory comes from retrieving
  relevant documents or records into context (same RAG mechanism from §5).
- **Planning (ReAct)** — Reason about the goal → Act with a tool → Observe the result → repeat
  until the task is complete.

**Reasoning models** (o1, o3, Claude thinking): instead of one forward pass, the model generates
hidden chain-of-thought tokens before producing its final answer. It can self-correct and
try multiple approaches — all via token generation. Better at multi-step problems; costs more tokens.

**Demo:** Step-by-step trace of a ReAct agent solving "What is the sum of the first 5 prime numbers?"
— reason, tool call, observe, reason, answer. Shows exactly how the loop hands off between
the model and user code.

> **Key insight:** The model never "does" anything. Your code does — based on what the model outputs.
> Intelligence emerges from the loop.

---

## 9. Now You Know How It Works

- **Prompt engineering** — the system prompt and conversation history are just more tokens. Context matters.
- **Hallucinations** — the model is sampling a distribution. It predicts plausible continuations, not facts.
- **Tool use / function calling** — the wrapper routes structured output tokens to real function calls.
- **RAG (Retrieval-Augmented Generation)** — inject relevant documents into the context before asking. Same mechanism.
- **Fine-tuning** — RLHF on a smaller, domain-specific dataset. Same mechanism, different data.

> **The magic isn't magic — it's matrix multiplication at scale, trained on human knowledge, guided by human feedback.**

---

## Credits

| | | |
|---|---|---|
| Training corpus | *The Complete Works of William Shakespeare* | Project Gutenberg eBook #100 — public domain |
| Presentation | reveal.js | Hakim El Hattab — MIT License |
| Graph visualisation | Sigma.js & Graphology | MIT License |
| Syntax highlighting | highlight.js | BSD 3-Clause License |
