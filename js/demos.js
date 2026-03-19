// ── runExample utility ───────────────────────────────────────────────────
const _AF = Object.getPrototypeOf(async function(){}).constructor;

async function runExample(filePath, btn, out) {
  if (btn) { btn.disabled = true; btn.textContent = '\u23F3 Running\u2026'; }
  out.classList.remove('error', 'visible');
  out.textContent = '';

  const lines = [];
  const origLog = console.log;
  console.log = (...args) => {
    lines.push(args.map(a =>
      typeof a === 'object' && a !== null ? JSON.stringify(a) : String(a)
    ).join(' '));
    origLog.apply(console, args);
  };

  try {
    const code = await fetch(filePath).then(r => r.text());
    await new _AF(code)();
    out.textContent = lines.join('\n') || '(no output)';
  } catch(e) {
    out.textContent = 'Error: ' + e.message;
    out.classList.add('error');
  } finally {
    console.log = origLog;
    if (btn) { btn.textContent = '\u21BB Run again'; btn.disabled = false; }
    out.classList.add('visible');
  }
}
// ── end runExample utility ───────────────────────────────────────────────

// ── Tokenizer demo (S2) ──────────────────────────────────────────────────
const TOK_COLORS = [
  '#dbeafe','#dcfce7','#fef3c7','#fce7f3','#ede9fe',
  '#e0f2fe','#fefce8','#f0fdf4','#fff7ed','#fdf4ff',
];

let _s2Tokenizer = null;

async function loadDemo2() {
  if (_s2Tokenizer) return _s2Tokenizer;
  const { words } = await fetch("data/tokenizer.json").then(r => r.json());
  const vocab = Object.fromEntries(words.map((w, i) => [w, i]));
  _s2Tokenizer = { words, vocab };
  return _s2Tokenizer;
}

async function runDemo2() {
  const t = await loadDemo2();
  const input = document.getElementById('tok-input').value;
  const tokens = input.toLowerCase().match(/\b\w+\b/g) || [];

  const tokensEl = document.getElementById('tok-tokens');
  const idsEl    = document.getElementById('tok-ids');
  const statsEl  = document.getElementById('tok-stats');

  let known = 0, unknown = 0;
  const chips = tokens.map(tok => {
    const id = t.vocab[tok] !== undefined ? t.vocab[tok] : -1;
    if (id === -1) unknown++; else known++;
    const bg  = id === -1 ? '#fee2e2' : TOK_COLORS[id % TOK_COLORS.length];
    const cls = id === -1 ? 'tok-chip tok-chip-unk' : 'tok-chip';
    return `<span class="${cls}" style="background:${bg}" title="ID: ${id === -1 ? '–' : id}">${tok}</span>`;
  });

  tokensEl.innerHTML = chips.length
    ? chips.join('')
    : '<span style="color:#8c959f;font-style:italic;font-family:var(--body-font)">Start typing…</span>';

  const ids = tokens.map(tok => t.vocab[tok] !== undefined ? t.vocab[tok] : -1);
  idsEl.textContent = ids.length ? '[' + ids.join(', ') + ']' : '';

  statsEl.textContent = tokens.length
    ? `${tokens.length} token${tokens.length !== 1 ? 's' : ''} · ${known} known · ${unknown} unk`
    : '';
}

function setTokInput(text) {
  document.getElementById('tok-input').value = text;
  runDemo2();
}
// ── end Tokenizer demo (S2) ──────────────────────────────────────────────

// ── Embeddings demo (S3) ─────────────────────────────────────────────────
let _s3Embeddings = null;
let _embChart = null;

async function loadDemo3() {
  if (_s3Embeddings) return _s3Embeddings;
  _s3Embeddings = await fetch("data/embeddings.json").then(r => r.json());
  return _s3Embeddings;
}

function embCosSim(a, b) { return a.reduce((s, v, i) => s + v * b[i], 0); }

function buildEmbSelects() {
  const words = Object.keys(_s3Embeddings).sort();
  const html  = words.map(w => `<option value="${w}">${w}</option>`).join('');
  document.getElementById('emb-word').innerHTML = html;
  document.getElementById('emb-a').innerHTML    = html;
  document.getElementById('emb-b').innerHTML    = html;
  document.getElementById('emb-c').innerHTML    = html;
  document.getElementById('emb-word').value = 'king';
  document.getElementById('emb-a').value = 'king';
  document.getElementById('emb-b').value = 'man';
  document.getElementById('emb-c').value = 'woman';
}

async function runDemo3Sim() {
  const emb  = await loadDemo3();
  const word = document.getElementById('emb-word').value;
  const vec  = emb[word];
  const all  = Object.keys(emb);

  const sims   = all
    .filter(w => w !== word)
    .map(w => ({ word: w, sim: embCosSim(vec, emb[w]) }))
    .sort((a, b) => b.sim - a.sim)
    .slice(0, 8);
  const labels = sims.map(s => s.word);
  const data   = sims.map(s => s.sim);
  const canvas = document.getElementById('emb-bars-chart');

  if (!_embChart) {
    _embChart = new Chart(canvas, {
      type: 'bar',
      data: { labels, datasets: [{ data, backgroundColor: 'rgba(37,99,235,0.75)', borderRadius: 4, borderSkipped: false, clip: false }] },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        layout: { padding: { right: 52 } },
        scales: {
          x: { display: false, min: 0 },
          y: { ticks: { font: { family: '"SFMono-Regular",Consolas,monospace', size: 13 }, color: '#1a1a1a' }, grid: { display: false } },
        },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
          datalabels: {
            display: true, anchor: 'end', align: 'right', offset: 4,
            formatter: v => v.toFixed(3),
            font: { family: '"SFMono-Regular",Consolas,monospace', size: 12 },
            color: '#6b7280',
          },
        },
      },
    });
  } else {
    _embChart.data.labels = labels;
    _embChart.data.datasets[0].data = data;
    _embChart.update();
  }
}

async function runDemo3Analogy() {
  const emb = await loadDemo3();
  const a   = document.getElementById('emb-a').value;
  const b   = document.getElementById('emb-b').value;
  const c   = document.getElementById('emb-c').value;
  const all = Object.keys(emb);

  const query = emb[a].map((v, i) => v - emb[b][i] + emb[c][i]);
  const norm  = Math.sqrt(query.reduce((s, v) => s + v * v, 0));
  const qNorm = query.map(v => v / norm);

  const results = all
    .filter(w => w !== a && w !== b && w !== c)
    .map(w => ({ word: w, sim: embCosSim(qNorm, emb[w]) }))
    .sort((x, y) => y.sim - x.sim)
    .slice(0, 3);

  document.getElementById('emb-analogy-result').innerHTML = results.map((r, i) =>
    `<span class="emb-res-chip ${i === 0 ? 'emb-res-top' : ''}">${r.word}<small>${r.sim.toFixed(2)}</small></span>`
  ).join('');
}

async function runDemo3() {
  await loadDemo3();
  buildEmbSelects();
  await Promise.all([runDemo3Sim(), runDemo3Analogy()]);
}
// ── end Embeddings demo (S3) ─────────────────────────────────────────────

// ── Transformer loop demo (S5) ───────────────────────────────────────────
let _s5Trigrams = null;
let _tl5Chart = null;
const TL_DEFAULT = 'to be or not to be that is the';

async function loadDemo5() {
  if (_s5Trigrams) return _s5Trigrams;
  _s5Trigrams = await fetch("data/trigrams.json").then(r => r.json());
  return _s5Trigrams;
}

function softmaxTemp5(counts, temp) {
  const entries = Object.entries(counts);
  const logits  = entries.map(([, c]) => Math.log(c + 1) / temp);
  const max     = Math.max(...logits);
  const exps    = logits.map(l => Math.exp(l - max));
  const sum     = exps.reduce((a, b) => a + b, 0);
  return entries
    .map(([word], i) => ({ word, prob: exps[i] / sum }))
    .sort((a, b) => b.prob - a.prob);
}

function sample5(probs) {
  let r = Math.random();
  for (const { word, prob } of probs) { r -= prob; if (r <= 0) return word; }
  return probs[probs.length - 1].word;
}

function demo5Temp() {
  return parseFloat(document.getElementById('tl-temp').value);
}

function demo5Context() {
  const words = document.getElementById('tl-prompt').value.toLowerCase().match(/\b\w+\b/g) || [];
  return words.length >= 2 ? words[words.length - 2] + ' ' + words[words.length - 1] : null;
}

async function updateDemo5() {
  const model   = await loadDemo5();
  const temp    = demo5Temp();
  const context = demo5Context();
  const ctxEl   = document.getElementById('tl-context');
  const canvas  = document.getElementById('tl-bars-chart');

  if (!context || !model[context]) {
    ctxEl.textContent = context || '(need at least 2 words)';
    if (_tl5Chart) { _tl5Chart.data.labels = []; _tl5Chart.data.datasets[0].data = []; _tl5Chart.update(); }
    return;
  }

  ctxEl.textContent = '"' + context + '"';
  const probs  = softmaxTemp5(model[context], temp).slice(0, 8);
  const labels = probs.map(p => p.word);
  const data   = probs.map(p => p.prob);

  if (!_tl5Chart) {
    _tl5Chart = new Chart(canvas, {
      type: 'bar',
      data: { labels, datasets: [{ data, backgroundColor: 'rgba(37,99,235,0.75)', borderRadius: 4, borderSkipped: false, clip: false }] },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 150 },
        layout: { padding: { right: 60 } },
        scales: {
          x: { display: false, min: 0, max: 1 },
          y: { ticks: { font: { family: '"SFMono-Regular",Consolas,monospace', size: 13 }, color: '#1a1a1a' }, grid: { display: false } },
        },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
          datalabels: {
            display: true, anchor: 'end', align: 'right', offset: 4,
            formatter: v => (v * 100).toFixed(1) + '%',
            font: { family: '"SFMono-Regular",Consolas,monospace', size: 12 },
            color: '#6b7280',
          },
        },
      },
    });
  } else {
    _tl5Chart.data.labels = labels;
    _tl5Chart.data.datasets[0].data = data;
    _tl5Chart.update();
  }
}

function demo5UpdateTemp() {
  const temp = demo5Temp();
  document.getElementById('tl-temp-val').textContent = temp.toFixed(2);
  document.getElementById('tl-temp-hint').textContent =
    temp < 0.5 ? 'focused' : temp < 1.3 ? 'balanced' : 'creative';
  updateDemo5();
}

async function demo5Generate() {
  const model   = await loadDemo5();
  const context = demo5Context();
  if (!context || !model[context]) return;
  const next = sample5(softmaxTemp5(model[context], demo5Temp()));
  const el   = document.getElementById('tl-prompt');
  el.value   = el.value.trim() + ' ' + next;
  updateDemo5();
}

function demo5Reset() {
  document.getElementById('tl-prompt').value = TL_DEFAULT;
  updateDemo5();
}

async function runDemo5() {
  await loadDemo5();
  updateDemo5();
}
// ── end Transformer loop demo (S5) ───────────────────────────────────────

// ── Attention demo (S4) ──────────────────────────────────────────────────
let _attn4SelectedIdx = null;
let _attn4Chart = null;
let _s4ConceptInitialised = false;

function makeAttnConceptChart(canvas, labels, data) {
  return new Chart(canvas, {
    type: 'bar',
    data: { labels, datasets: [{ data, backgroundColor: 'rgba(207,34,46,0.75)', borderRadius: 4, borderSkipped: false }] },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 0 },
      layout: { padding: { right: 50 } },
      scales: {
        x: { display: false, min: 0, max: 20 },
        y: { ticks: { font: { family: '"SFMono-Regular",Consolas,monospace', size: 13 }, color: '#1a1a1a' }, grid: { display: false }, afterFit: axis => { axis.width = 64; } },
      },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
        datalabels: {
          display: true, anchor: 'end', align: 'right', offset: 4,
          formatter: v => v.toFixed(1) + '%',
          font: { family: '"SFMono-Regular",Consolas,monospace', size: 12 },
          color: '#6b7280',
        },
      },
    },
  });
}

function runS4Concept() {
  if (_s4ConceptInitialised) return;
  _s4ConceptInitialised = true;
  const c1 = makeAttnConceptChart(document.getElementById('attn-concept-embrace'), ['the', 'his', 'queen'], [16.8, 15.5, 15.4]);
  const c2 = makeAttnConceptChart(document.getElementById('attn-concept-weapons'), ['battle', 'and', 'men'], [16.3, 14.2, 12.7]);
  requestAnimationFrame(() => requestAnimationFrame(() => { c1.resize(); c2.resize(); }));
}
// ── end Attention concept charts ──────────────────────────────────────────

// Reuse _s3Embeddings — same file, loaded by demo 3
async function loadDemo4() { return loadDemo3(); }

function softmax4(scores) {
  const max  = Math.max(...scores);
  const exps = scores.map(s => Math.exp(s - max));
  const sum  = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

function dotProd4(a, b) { return a.reduce((s, v, i) => s + v * b[i], 0); }

function attn4Words() {
  return (document.getElementById('attn4-input').value.toLowerCase().match(/\b\w+\b/g) || []);
}

function renderAttn4ChipHTML(words, emb, selectedIdx) {
  return words.map((w, i) => {
    const known = !!emb[w];
    const sel   = i === selectedIdx ? ' attn4-chip-sel' : '';
    const cls   = known ? `attn4-chip attn4-chip-ok${sel}` : 'attn4-chip attn4-chip-unk';
    const click = known ? `onclick="selectAttn4Word(${i})"` : '';
    return `<span class="${cls}" ${click}>${w}</span>`;
  }).join('');
}

async function renderAttn4Chips() {
  const emb   = await loadDemo4();
  const words = attn4Words();
  document.getElementById('attn4-chips').innerHTML = renderAttn4ChipHTML(words, emb, _attn4SelectedIdx);

  if (_attn4SelectedIdx === null) {
    const first = words.findIndex(w => emb[w]);
    if (first >= 0) selectAttn4Word(first);
  } else {
    selectAttn4Word(_attn4SelectedIdx);
  }
}

async function selectAttn4Word(idx) {
  _attn4SelectedIdx = idx;
  const emb   = await loadDemo4();
  const words = attn4Words();

  document.getElementById('attn4-chips').innerHTML = renderAttn4ChipHTML(words, emb, idx);

  const word = words[idx];
  if (!emb[word]) return;

  const others  = words.filter((w, i) => i !== idx && emb[w]);
  const scores  = others.map(w => dotProd4(emb[word], emb[w]));
  const weights = softmax4(scores);
  const pairs   = others
    .map((w, i) => ({ word: w, weight: weights[i] }))
    .sort((a, b) => b.weight - a.weight);

  document.getElementById('attn4-label').textContent = `"${word}" attends to:`;
  const labels = pairs.map(p => p.word);
  const data   = pairs.map(p => p.weight);
  const canvas = document.getElementById('attn4-bars-chart');

  if (!_attn4Chart) {
    _attn4Chart = new Chart(canvas, {
      type: 'bar',
      data: { labels, datasets: [{ data, backgroundColor: 'rgba(37,99,235,0.75)', borderRadius: 4, borderSkipped: false, clip: false }] },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 250 },
        layout: { padding: { right: 60 } },
        scales: {
          x: { display: false, min: 0 },
          y: { ticks: { font: { family: '"SFMono-Regular",Consolas,monospace', size: 14 }, color: '#1a1a1a' }, grid: { display: false } },
        },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
          datalabels: {
            display: true, anchor: 'end', align: 'right', offset: 4,
            formatter: v => (v * 100).toFixed(1) + '%',
            font: { family: '"SFMono-Regular",Consolas,monospace', size: 13 },
            color: '#6b7280',
          },
        },
      },
    });
  } else {
    _attn4Chart.data.labels = labels;
    _attn4Chart.data.datasets[0].data = data;
    _attn4Chart.update();
  }
}

function setAttn4(text) {
  document.getElementById('attn4-input').value = text;
  _attn4SelectedIdx = null;
  renderAttn4Chips();
}

async function runDemo4() {
  _attn4SelectedIdx = null;
  await renderAttn4Chips();
}
// ── end Attention demo (S4) ──────────────────────────────────────────────

// ── Bigram demo (S1) ─────────────────────────────────────────────────────
let _s1Model = null;
let _demo1Timer = null;
let _demo1Graph = null;
let _demo1Camera = null;

function initDemo1Graph(model, container) {
  const graph = new graphology.Graph({ type: 'directed', multi: false });

  // Arrange characters in a circle
  const chars = Object.keys(model);
  chars.forEach((char, i) => {
    const angle = (2 * Math.PI * i) / chars.length - Math.PI / 2;
    graph.addNode(char, {
      x: Math.cos(angle),
      y: Math.sin(angle),
      size: 12,
      label: char === ' ' ? '·' : char,
      color: '#f0f0f0',
      forceLabel: true,
    });
  });

  // Top-3 outgoing edges per character
  for (const [src, counts] of Object.entries(model)) {
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3)
      .forEach(([tgt, cnt]) => {
        if (src !== tgt && !graph.hasEdge(src, tgt)) {
          graph.addEdge(src, tgt, {
            size: Math.max(0.5, (cnt / total) * 5),
            color: '#d0d7de',
          });
        }
      });
  }

  const renderer = new Sigma(graph, container, {
    zIndex: true,
    renderEdgeLabels: false,
    labelFont: 'monospace',
    labelWeight: 'bold',
    labelSize: 18,
    labelColor: { color: '#1f2328' },
    defaultEdgeColor: '#d0d7de',
    allowInvalidContainer: true,
  });
  _demo1Camera = renderer.getCamera();

  let _startChar = null;
  let _hoveredNode = null;

  function getTop3(char) {
    const counts = model[char] || {};
    return new Set(Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t));
  }

  function applyReducers() {
    const activeTop3 = _startChar ? getTop3(_startChar) : new Set();
    const hoverTop3  = _hoveredNode && _hoveredNode !== _startChar ? getTop3(_hoveredNode) : new Set();

    renderer.setSetting('nodeReducer', (node, data) => {
      if (node === _startChar)   return { ...data, color: '#0969da', zIndex: 2 };
      if (node === _hoveredNode) return { ...data, color: '#8250df', zIndex: 2 };
      if (activeTop3.has(node))  return { ...data, color: '#9dc8f5', zIndex: 1 };
      if (hoverTop3.has(node))   return { ...data, color: '#d2b4fe', zIndex: 1 };
      return { ...data, color: '#f0f0f0', zIndex: 0 };
    });
    renderer.setSetting('edgeReducer', (edge, data) => {
      const src = graph.source(edge);
      if (src === _startChar)   return { ...data, color: '#0969da', size: data.size * 2.5, zIndex: 1 };
      if (src === _hoveredNode) return { ...data, color: '#8250df', size: data.size * 2,   zIndex: 1 };
      return { ...data, color: '#ebebeb', size: Math.max(0.3, data.size * 0.6), zIndex: 0 };
    });
  }

  // Custom hover/click — corrects for reveal.js CSS transform scaling.
  // Sigma's built-in hit-testing uses container.offsetWidth for the coordinate
  // system but event.clientX is in visual (post-transform) pixels, causing a
  // shift. We compute corrected canvas-pixel coordinates ourselves.
  container.addEventListener('mousemove', (event) => {
    const rect = container.getBoundingClientRect();
    const scaleX = container.offsetWidth  / rect.width;
    const scaleY = container.offsetHeight / rect.height;
    const mx = (event.clientX - rect.left) * scaleX;
    const my = (event.clientY - rect.top)  * scaleY;

    const threshold = 24;
    let closest = null, closestDist = threshold;
    graph.forEachNode((node, attrs) => {
      const vp = renderer.graphToViewport(attrs);
      const dist = Math.hypot(vp.x - mx, vp.y - my);
      if (dist < closestDist) { closestDist = dist; closest = node; }
    });

    if (closest !== _hoveredNode) { _hoveredNode = closest; applyReducers(); }
  });

  container.addEventListener('mouseleave', () => {
    if (_hoveredNode !== null) { _hoveredNode = null; applyReducers(); }
  });

  container.addEventListener('click', () => {
    if (_hoveredNode) {
      document.getElementById('demo1-start').value = _hoveredNode;
      runDemo1();
    }
  });

  return {
    update(startChar) {
      _startChar = startChar;
      applyReducers();
    },
    kill() { renderer.kill(); },
  };
}

function demo1Zoom(dir) {
  if (!_demo1Camera) return;
  const s = _demo1Camera.getState();
  _demo1Camera.setState({ x: s.x, y: s.y, angle: s.angle, ratio: dir > 0 ? s.ratio * 0.75 : s.ratio / 0.75 });
}

function demo1ResetCamera() {
  if (!_demo1Camera) return;
  _demo1Camera.animatedReset();
}

async function runDemo1() {
  clearTimeout(_demo1Timer);
  _demo1Timer = setTimeout(async () => {
    const out = document.getElementById('demo1-output');
    if (!_s1Model) {
      out.textContent = 'Loading…';
      _s1Model = await fetch("data/bigrams.json").then(r => r.json());
    }
    const start = document.getElementById('demo1-start').value.toLowerCase() || 't';
    const length = parseInt(document.getElementById('demo1-length').value);
    const strategy = document.getElementById('demo1-strategy').value;

    const graphContainer = document.getElementById('demo1-graph');
    if (!_demo1Graph && graphContainer.clientWidth > 0) _demo1Graph = initDemo1Graph(_s1Model, graphContainer);
    if (_demo1Graph) _demo1Graph.update(start);

    const predictGreedy = (model, char) => {
      const counts = model[char];
      if (!counts) return '?';
      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    };
    const sampleChar = (model, char) => {
      const counts = model[char];
      if (!counts) return '?';
      const entries = Object.entries(counts);
      const total = entries.reduce((s, [, c]) => s + c, 0);
      let r = Math.random() * total;
      for (const [next, cnt] of entries) { r -= cnt; if (r <= 0) return next; }
      return entries[entries.length - 1][0];
    };

    const fn = strategy === 'greedy' ? predictGreedy : sampleChar;
    let text = start;
    for (let i = 0; i < length; i++) text += fn(_s1Model, text[text.length - 1]);
    out.textContent = text;
  }, 80);
}
// ── end Bigram demo (S1) ─────────────────────────────────────────────────

// ── Slide event handlers ─────────────────────────────────────────────────
function rerunTab(btn) {
  const out = btn.previousElementSibling;
  runExample(btn.closest('.code-split').dataset.src, btn, out);
}

// ── S2 countUp animations ─────────────────────────────────────────────────
function runS2CountUp() {
  new countUp.CountUp('s2-count-tokens-1', 996, { suffix: 'K', duration: 2 }).start();
  new countUp.CountUp('s2-count-types-1', 25900, { separator: ',', duration: 2 }).start();
}
// ── end S2 countUp animations ─────────────────────────────────────────────

Reveal.on('slidechanged', event => {
  if (event.currentSlide.id === 's1-bigram-demo') { runDemo1(); return; }
  if (event.currentSlide.id === 's2-tokenization') { runS2CountUp(); return; }
  if (event.currentSlide.id === 's2-tokenizer-demo') { runDemo2(); return; }
  if (event.currentSlide.id === 's3-embeddings-demo') { runDemo3(); return; }
  if (event.currentSlide.id === 's4-attention') { runS4Concept(); return; }
  if (event.currentSlide.id === 's4-attention-demo') { runDemo4(); return; }
  if (event.currentSlide.id === 's5-transformer-demo') { runDemo5(); return; }

  const split = event.currentSlide.querySelector('.code-split');
  if (split) {
    const out = split.querySelector('.run-output');
    const btn = split.querySelector('.rerun-btn');
    if (!out.classList.contains('visible')) runExample(split.dataset.src, btn, out);
  }
});
// ── end Slide event handlers ─────────────────────────────────────────────
