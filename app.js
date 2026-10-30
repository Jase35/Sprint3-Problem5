/* =============================================================================
   Complexity & Side Channels — interactive teaching module
   All three modules are self-contained; nothing talks to the network.
   ========================================================================== */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/* =============================================================================
   MODULE 1 — Growth rates
   ========================================================================== */

const COMPLEXITIES = [
  { id: 'const', label: 'O(1)', color: '#7ee3a4', example: 'Hash table lookup', fn: () => 1 },
  { id: 'log', label: 'O(log n)', color: '#5bc0ff', example: 'Binary search', fn: (n) => Math.log2(Math.max(n, 1)) || 1 },
  { id: 'lin', label: 'O(n)', color: '#c59bff', example: 'Linear scan', fn: (n) => n },
  { id: 'nlogn', label: 'O(n log n)', color: '#ffc857', example: 'Merge sort', fn: (n) => n * (Math.log2(Math.max(n, 2))) },
  { id: 'quad', label: 'O(n²)', color: '#ff9d5c', example: 'Bubble sort / nested loops', fn: (n) => n * n },
  { id: 'exp', label: 'O(2ⁿ)', color: '#ff6b6b', example: 'Brute-forcing a password', fn: (n) => Math.pow(2, n) },
];

const enabledClasses = new Set(COMPLEXITIES.map((c) => c.id));

const nSlider = document.getElementById('nSlider');
const nValue = document.getElementById('nValue');
const speedSelect = document.getElementById('speedSelect');
const logScale = document.getElementById('logScale');
const classToggles = document.getElementById('classToggles');
const chart = document.getElementById('growthChart');
const growthTableBody = document.querySelector('#growthTable tbody');

function buildClassToggles() {
  COMPLEXITIES.forEach((c) => {
    const chip = document.createElement('label');
    chip.className = 'chip';
    chip.innerHTML =
      `<input type="checkbox" checked data-id="${c.id}" />` +
      `<span class="swatch" style="background:${c.color}"></span>` +
      `<span>${c.label}</span>`;
    chip.querySelector('input').addEventListener('change', (e) => {
      if (e.target.checked) enabledClasses.add(c.id);
      else enabledClasses.delete(c.id);
      chip.classList.toggle('off', !e.target.checked);
      renderGrowth();
    });
    classToggles.appendChild(chip);
  });
}

function formatOps(value) {
  if (!isFinite(value)) return '∞';
  if (value < 1000) return value.toFixed(value < 10 ? 1 : 0);
  if (value < 1e6) return Math.round(value).toLocaleString();
  return value.toExponential(2).replace('e+', ' × 10^');
}

function formatDuration(seconds) {
  if (!isFinite(seconds)) return 'forever';
  const units = [
    [1e-9, 'ns'], [1e-6, 'µs'], [1e-3, 'ms'], [1, 's'],
    [60, 'min'], [3600, 'hours'], [86400, 'days'], [31557600, 'years'],
  ];
  if (seconds < 1e-9) return `${(seconds * 1e9).toFixed(2)} ns`;
  let chosen = units[0];
  for (const u of units) if (seconds >= u[0]) chosen = u;
  const scaled = seconds / chosen[0];
  if (scaled >= 1e6) return `${scaled.toExponential(2).replace('e+', ' × 10^')} ${chosen[1]}`;
  return `${scaled.toFixed(scaled < 10 ? 2 : 0)} ${chosen[1]}`;
}

function drawChart(n, useLog) {
  const ctx = chart.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const cssW = chart.clientWidth || 900;
  const cssH = 420;
  chart.width = cssW * dpr;
  chart.height = cssH * dpr;
  chart.style.height = `${cssH}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);

  const pad = { l: 96, r: 16, t: 18, b: 40 };
  const w = cssW - pad.l - pad.r;
  const h = cssH - pad.t - pad.b;

  const active = COMPLEXITIES.filter((c) => enabledClasses.has(c.id));
  const maxVal = Math.max(1, ...active.map((c) => c.fn(n)));
  const toY = (v) => {
    const frac = useLog
      ? Math.log10(Math.max(v, 1)) / Math.log10(Math.max(maxVal, 10))
      : v / maxVal;
    return pad.t + h - clamp(frac, 0, 1) * h;
  };
  const toX = (x) => pad.l + (x / Math.max(n, 1)) * w;

  // grid + axes
  ctx.strokeStyle = '#223049';
  ctx.fillStyle = '#9aa8bf';
  ctx.font = '11px Consolas, monospace';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = pad.t + (h * i) / 5;
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(pad.l + w, y);
    ctx.stroke();
    const frac = 1 - i / 5;
    const val = useLog
      ? Math.pow(10, frac * Math.log10(Math.max(maxVal, 10)))
      : frac * maxVal;
    ctx.textAlign = 'right';
    ctx.fillText(formatOps(val), pad.l - 8, y + 4);
  }
  ctx.textAlign = 'center';
  for (let i = 0; i <= 4; i++) {
    const x = pad.l + (w * i) / 4;
    ctx.fillText(Math.round((n * i) / 4), x, pad.t + h + 18);
  }
  ctx.fillText('input size n', pad.l + w / 2, cssH - 6);

  ctx.save();
  ctx.translate(16, pad.t + h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText(useLog ? 'operations (log scale)' : 'operations', 0, 0);
  ctx.restore();

  // curves
  active.forEach((c) => {
    ctx.strokeStyle = c.color;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    const steps = 240;
    for (let i = 0; i <= steps; i++) {
      const x = (n * i) / steps;
      const v = c.fn(Math.max(x, x === 0 ? 0.001 : x));
      const px = toX(x);
      const py = toY(v);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // endpoint dot + label
    const endY = toY(c.fn(n));
    ctx.fillStyle = c.color;
    ctx.beginPath();
    ctx.arc(toX(n), endY, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.textAlign = 'right';
    ctx.font = 'bold 11px Consolas, monospace';
    ctx.fillText(c.label, toX(n) - 12, clamp(endY - 8, pad.t + 10, pad.t + h));
    ctx.font = '11px Consolas, monospace';
  });
}

function renderGrowthTable(n, opsPerSec) {
  growthTableBody.innerHTML = '';
  COMPLEXITIES.forEach((c) => {
    const ops = c.fn(n);
    const seconds = ops / opsPerSec;
    const row = document.createElement('tr');
    if (seconds > 1) row.classList.add('hot');
    row.innerHTML =
      `<td><span class="swatch" style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${c.color};margin-right:6px"></span><code>${c.label}</code></td>` +
      `<td>${c.example}</td>` +
      `<td class="num">${formatOps(ops)}</td>` +
      `<td class="num">${formatDuration(seconds)}</td>`;
    growthTableBody.appendChild(row);
  });
}

function renderGrowth() {
  const n = Number(nSlider.value);
  nValue.textContent = n;
  document.querySelectorAll('.n-echo').forEach((el) => (el.textContent = n));
  drawChart(n, logScale.checked);
  renderGrowthTable(n, Number(speedSelect.value));
}

buildClassToggles();
nSlider.addEventListener('input', renderGrowth);
speedSelect.addEventListener('change', renderGrowth);
logScale.addEventListener('change', renderGrowth);
window.addEventListener('resize', renderGrowth);
renderGrowth();

/* =============================================================================
   MODULE 2 — Linear vs. binary search race
   ========================================================================== */

const ARRAY_SIZES = [8, 16, 32, 64, 128, 256, 512, 1024];

const arraySlider = document.getElementById('arraySlider');
const arrayValue = document.getElementById('arrayValue');
const raceSpeed = document.getElementById('raceSpeed');
const raceBtn = document.getElementById('raceBtn');
const newArrayBtn = document.getElementById('newArrayBtn');
const targetValueEl = document.getElementById('targetValue');
const linearCells = document.getElementById('linearCells');
const binaryCells = document.getElementById('binaryCells');
const linearProbes = document.getElementById('linearProbes');
const binaryProbes = document.getElementById('binaryProbes');
const linearStatus = document.getElementById('linearStatus');
const binaryStatus = document.getElementById('binaryStatus');

let raceData = [];
let targetIndex = 0;
let raceRunning = false;

function buildCells(container, size) {
  container.innerHTML = '';
  const px = size <= 128 ? 11 : size <= 512 ? 7 : 5;
  for (let i = 0; i < size; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.style.width = `${px}px`;
    cell.style.height = `${px}px`;
    container.appendChild(cell);
  }
}

function resetRace() {
  const size = ARRAY_SIZES[Number(arraySlider.value)];
  arrayValue.textContent = size;
  raceData = Array.from({ length: size }, (_, i) => (i + 1) * 3);
  targetIndex = Math.floor(Math.random() * size);
  targetValueEl.textContent = raceData[targetIndex];
  buildCells(linearCells, size);
  buildCells(binaryCells, size);
  linearProbes.textContent = '0';
  binaryProbes.textContent = '0';
  linearStatus.textContent = '';
  binaryStatus.textContent = '';
}

async function runLinear(target, delay) {
  const cells = linearCells.children;
  let probes = 0;
  for (let i = 0; i < raceData.length; i++) {
    probes++;
    linearProbes.textContent = probes;
    cells[i].className = 'cell current';
    await sleep(delay);
    if (raceData[i] === target) {
      cells[i].className = 'cell found';
      linearStatus.textContent = `— found at index ${i}`;
      return probes;
    }
    cells[i].className = 'cell probed';
  }
  return probes;
}

async function runBinary(target, delay) {
  const cells = binaryCells.children;
  let lo = 0;
  let hi = raceData.length - 1;
  let probes = 0;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    probes++;
    binaryProbes.textContent = probes;
    cells[mid].className = 'cell current';
    await sleep(delay * 2.5);
    if (raceData[mid] === target) {
      cells[mid].className = 'cell found';
      binaryStatus.textContent = `— found at index ${mid}`;
      return probes;
    }
    cells[mid].className = 'cell probed';
    if (raceData[mid] < target) {
      for (let i = lo; i <= mid; i++) if (!cells[i].classList.contains('probed')) cells[i].className = 'cell discarded';
      lo = mid + 1;
    } else {
      for (let i = mid; i <= hi; i++) if (!cells[i].classList.contains('probed')) cells[i].className = 'cell discarded';
      hi = mid - 1;
    }
  }
  return probes;
}

async function race() {
  if (raceRunning) return;
  raceRunning = true;
  raceBtn.disabled = true;
  newArrayBtn.disabled = true;
  arraySlider.disabled = true;
  resetRace();
  const delay = Number(raceSpeed.value) / Math.max(1, Math.log2(raceData.length) / 3);
  const target = raceData[targetIndex];
  await Promise.all([runLinear(target, delay), runBinary(target, delay)]);
  raceRunning = false;
  raceBtn.disabled = false;
  newArrayBtn.disabled = false;
  arraySlider.disabled = false;
}

arraySlider.addEventListener('input', resetRace);
newArrayBtn.addEventListener('click', resetRace);
raceBtn.addEventListener('click', race);
resetRace();

/* =============================================================================
   MODULE 3 — Timing side-channel simulation
   ========================================================================== */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const NS_PER_COMPARISON = 12; // simulated cost of comparing one character
const PAD_CHAR = '_';         // never part of the alphabet, so padding always mismatches

const secretInput = document.getElementById('secretInput');
const compareMode = document.getElementById('compareMode');
const noiseSlider = document.getElementById('noiseSlider');
const noiseValue = document.getElementById('noiseValue');
const samplesSlider = document.getElementById('samplesSlider');
const samplesValue = document.getElementById('samplesValue');
const guessInput = document.getElementById('guessInput');
const measureBtn = document.getElementById('measureBtn');
const measureResult = document.getElementById('measureResult');
const attackBtn = document.getElementById('attackBtn');
const resetAttackBtn = document.getElementById('resetAttackBtn');
const attackState = document.getElementById('attackState');
const recoveredText = document.getElementById('recoveredText');
const candidateBars = document.getElementById('candidateBars');
const candidateTitle = document.getElementById('candidateTitle');
const bruteCost = document.getElementById('bruteCost');
const sideCost = document.getElementById('sideCost');

let attackRunning = false;
let cancelAttack = false;

function getSecret() {
  const cleaned = secretInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return cleaned || 'CANARY';
}

/** Gaussian noise via Box-Muller, used to model measurement jitter. */
function jitter(stdev) {
  if (stdev <= 0) return 0;
  const u = Math.random() || 1e-9;
  const v = Math.random() || 1e-9;
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * stdev;
}

/**
 * Simulated server. Returns how long the comparison "took" in nanoseconds.
 * vulnerable: stops at the first mismatch -> duration leaks the matching prefix.
 * constant:   always inspects every character -> duration reveals nothing.
 */
function respond(guess, secret, mode) {
  let steps;
  if (guess.length !== secret.length) {
    steps = mode === 'constant' ? secret.length : 1;
  } else if (mode === 'constant') {
    steps = secret.length;
  } else {
    let matched = 0;
    while (matched < secret.length && guess[matched] === secret[matched]) matched++;
    steps = Math.min(matched + 1, secret.length);
  }
  const noise = Number(noiseSlider.value);
  return steps * NS_PER_COMPARISON + jitter(noise);
}

/** Averaging many samples cancels the random jitter and exposes the real difference. */
function measure(guess, secret, mode, samples) {
  let total = 0;
  for (let i = 0; i < samples; i++) total += respond(guess, secret, mode);
  return { time: total / samples, accepted: guess === secret };
}

function renderBars(entries, bestIndex) {
  candidateBars.innerHTML = '';
  if (!entries.length) {
    candidateBars.innerHTML = '<p class="bars-empty">Run the attack (or measure a guess) to see timings.</p>';
    return;
  }
  const times = entries.map((e) => e.time);
  const max = Math.max(...times);
  const min = Math.min(...times);
  const span = Math.max(max - min, 1e-6);
  entries.forEach((entry, i) => {
    // normalise against the spread so small differences stay visible
    const height = 12 + ((entry.time - min) / span) * 86;
    const bar = document.createElement('div');
    bar.className = 'bar' + (i === bestIndex ? ' best' : '');
    bar.title = `${entry.label}: ${entry.time.toFixed(2)} ns`;
    bar.innerHTML = `<div class="fill" style="height:${height}%"></div><div class="tick">${entry.label}</div>`;
    candidateBars.appendChild(bar);
  });
}

function updateCostTable() {
  const secret = getSecret();
  const k = ALPHABET.length;
  const n = secret.length;
  const samples = Number(samplesSlider.value);
  const brute = Math.pow(k, n);
  const side = k * n * samples;
  bruteCost.textContent = `${formatOps(brute)} guesses for a ${n}-character token (k = ${k})`;
  sideCost.textContent = `${side.toLocaleString()} requests (${k} candidates × ${n} positions × ${samples} samples)`;
}

function resetAttackUI() {
  cancelAttack = true;
  const secret = getSecret();
  recoveredText.textContent = '·'.repeat(secret.length);
  candidateTitle.textContent = 'Average response time per candidate character';
  renderBars([], -1);
  attackState.textContent = 'Idle';
  measureResult.textContent = '—';
  updateCostTable();
}

measureBtn.addEventListener('click', () => {
  const secret = getSecret();
  const guess = guessInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const mode = compareMode.value;
  const samples = Number(samplesSlider.value);
  const result = measure(guess, secret, mode, samples);
  const baseline = measure('#'.repeat(secret.length), secret, mode, samples).time;
  measureResult.innerHTML =
    `Answer: <strong>${result.accepted ? 'accepted ✅' : 'rejected ❌'}</strong> · ` +
    `avg time <strong>${result.time.toFixed(2)} ns</strong> ` +
    `(a guess wrong from character 1 takes ${baseline.toFixed(2)} ns)`;
  renderBars(
    [
      { label: 'wrong@1', time: baseline },
      { label: 'yours', time: result.time },
    ],
    result.time > baseline ? 1 : 0
  );
  candidateTitle.textContent = 'Your guess vs. a guess that is wrong from the first character';
});

async function runAttack() {
  if (attackRunning) return;
  attackRunning = true;
  cancelAttack = false;
  attackBtn.disabled = true;
  secretInput.disabled = true;

  const secret = getSecret();
  const mode = compareMode.value;
  const samples = Number(samplesSlider.value);
  const n = secret.length;
  let recovered = '';
  let requests = 0;

  candidateTitle.textContent = 'Average response time per candidate character';

  for (let pos = 0; pos < n; pos++) {
    const entries = [];
    const isLastPosition = pos === n - 1;
    let bestIndex = 0;
    let bestTime = -Infinity;

    for (let i = 0; i < ALPHABET.length; i++) {
      if (cancelAttack) break;
      const ch = ALPHABET[i];
      const guess = (recovered + ch).padEnd(n, PAD_CHAR);
      const { time, accepted } = measure(guess, secret, mode, samples);
      requests += samples;
      entries.push({ label: ch, time });
      // The final character produces no timing difference (the compare ends either way),
      // so the attacker falls back on the plain accept/reject answer for it.
      if (isLastPosition && accepted) {
        bestIndex = i;
        renderBars(entries, bestIndex);
        break;
      }
      if (!isLastPosition && time > bestTime) {
        bestTime = time;
        bestIndex = i;
      }
      renderBars(entries, isLastPosition ? -1 : bestIndex);
      attackState.textContent =
        `Probing position ${pos + 1}/${n} — candidate '${ch}' — ${requests.toLocaleString()} requests so far`;
      await sleep(8);
    }

    if (cancelAttack) break;
    recovered += ALPHABET[bestIndex];
    recoveredText.textContent = recovered + '·'.repeat(n - recovered.length);
    if (isLastPosition) {
      candidateTitle.textContent =
        'Last position: timings are identical, so the attacker uses the plain accept/reject answer';
    }
    await sleep(260);
  }

  if (!cancelAttack) {
    const success = recovered === secret;
    const brute = Math.pow(ALPHABET.length, n);
    attackState.innerHTML = success
      ? `✅ Secret recovered in <strong>${requests.toLocaleString()}</strong> requests ` +
        `instead of up to ${formatOps(brute)} brute-force guesses.`
      : `❌ Attack failed — recovered "<strong>${recovered}</strong>". ` +
        (mode === 'constant'
          ? 'The constant-time compare leaks no timing signal, so every candidate looks identical.'
          : 'The jitter is drowning the signal — raise the sample count and try again.');
  } else {
    attackState.textContent = 'Attack reset.';
  }

  attackRunning = false;
  attackBtn.disabled = false;
  secretInput.disabled = false;
}

attackBtn.addEventListener('click', runAttack);
resetAttackBtn.addEventListener('click', resetAttackUI);
secretInput.addEventListener('input', resetAttackUI);
compareMode.addEventListener('change', resetAttackUI);
noiseSlider.addEventListener('input', () => {
  noiseValue.textContent = noiseSlider.value;
});
samplesSlider.addEventListener('input', () => {
  samplesValue.textContent = samplesSlider.value;
  updateCostTable();
});
resetAttackUI();

/* =============================================================================
   MODULE 4 — Quiz
   ========================================================================== */

const QUIZ = [
  {
    q: 'An algorithm runs in O(n²). You buy hardware that is 100× faster. Roughly how much larger an input can you handle in the same time?',
    options: ['100× larger', '10× larger', '2× larger', 'No change'],
    answer: 1,
    why: 'Time grows with n², so a 100× speed-up only buys √100 = 10× more input. Better algorithms beat better hardware.',
  },
  {
    q: 'Why does an early-exit string comparison leak information?',
    options: [
      'It returns the secret in the error message',
      'Its running time depends on how many leading characters matched',
      'It uses more memory for longer secrets',
      'It is slower than a constant-time compare',
    ],
    answer: 1,
    why: 'The number of character comparisons — and therefore the duration — is a function of the secret, so the duration is a side channel.',
  },
  {
    q: 'A timing attack turns password recovery from O(k^n) into roughly what?',
    options: ['O(1)', 'O(log n)', 'O(k·n)', 'Still O(k^n)'],
    answer: 2,
    why: 'Each position can be solved independently: try all k characters at position 1, lock it in, move on — k × n probes instead of k^n.',
  },
  {
    q: 'Measurement noise is high. What does an attacker do?',
    options: [
      'Give up — noise makes timing attacks impossible',
      'Average many samples per guess until the signal emerges',
      'Switch to a longer password',
      'Ask the server to disable jitter',
    ],
    answer: 1,
    why: 'Random noise averages toward zero while the real timing difference does not. Adding jitter raises the cost of an attack but does not prevent it — constant-time code does.',
  },
];

const quizContainer = document.getElementById('quizContainer');
const quizScore = document.getElementById('quizScore');
let answered = 0;
let correct = 0;

QUIZ.forEach((item, qi) => {
  const wrap = document.createElement('div');
  wrap.className = 'quiz-item';
  const q = document.createElement('p');
  q.className = 'quiz-q';
  q.textContent = `${qi + 1}. ${item.q}`;
  wrap.appendChild(q);

  const feedback = document.createElement('p');
  feedback.className = 'quiz-feedback';

  item.options.forEach((opt, oi) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quiz-option';
    btn.textContent = opt;
    btn.addEventListener('click', () => {
      const buttons = wrap.querySelectorAll('.quiz-option');
      buttons.forEach((b, bi) => {
        b.disabled = true;
        if (bi === item.answer) b.classList.add('correct');
      });
      if (oi !== item.answer) btn.classList.add('wrong');
      else correct++;
      answered++;
      feedback.textContent = (oi === item.answer ? '✅ Correct. ' : '❌ Not quite. ') + item.why;
      quizScore.textContent = `Score: ${correct} / ${answered} answered (${QUIZ.length} questions total)`;
    });
    wrap.appendChild(btn);
  });

  wrap.appendChild(feedback);
  quizContainer.appendChild(wrap);
});
