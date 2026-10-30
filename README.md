# Complexity &amp; Side Channels — An Interactive Lesson

A small, dependency-free teaching module that connects two ideas students usually meet
separately:

1. **Algorithmic complexity** — how the amount of work an algorithm does grows with input size.
2. **Side-channel attacks** — how the *time* that work takes can itself leak secret data.

Everything runs in a standard browser from static files. There is no build step, no network
access, and no real system is probed: the security module is a **simulation** driven by a cost
model, so the lesson is safe, repeatable, and offline.

---

## Quick start

Clone or download the repository, then either:

**Option A — open the file directly**

Double-click `index.html` (or open it from your browser's *File → Open*). Everything works from
the `file://` protocol.

**Option B — serve it locally** (recommended, avoids browser file-protocol quirks)

```bash
# Python 3
python -m http.server 8000

# or Node
npx serve .
```

Then visit <http://localhost:8000/index.html>.

Tested in current Chrome, Edge, and Firefox. No dependencies, no installation, no build tooling.

---

## What's inside

| File | Purpose |
| --- | --- |
| `index.html` | Page structure and all lesson copy |
| `styles.css` | Styling and layout |
| `app.js` | All four interactive modules (chart, search race, timing simulation, quiz) |
| `README.md` | This file |

---

## The five sections

### 1. Growth rates — "How fast does the work grow?"

An animated canvas chart plots `O(1)`, `O(log n)`, `O(n)`, `O(n log n)`, `O(n²)` and `O(2ⁿ)`
side by side, with a table showing the operation count and the estimated wall-clock time for the
current input size.

**Interactions**

- **Slider** — input size `n` from 1 to 64.
- **Dropdown** — machine speed (1 million / 1 billion / 1 trillion ops per second).
- **Toggle** — linear vs. logarithmic y-axis.
- **Chips** — show or hide individual complexity classes.

**Concept:** growth rate dominates hardware. At `n = 64`, an `O(2ⁿ)` algorithm needs more
operations than a trillion-op-per-second machine can finish in a human lifetime, while
`O(n log n)` finishes instantly.

### 2. Search race — linear vs. binary search

Two sorted arrays are searched for the same value, with each probe animated cell by cell and
counted live.

**Interactions**

- **Slider** — array size (8 → 1024 items).
- **Dropdown** — animation speed.
- **Buttons** — pick a new random target, run the race.

**Concept:** `O(n)` versus `O(log n)` is not a small constant-factor difference. Doubling a
1,024-item array adds 1,024 probes to linear search and exactly **one** probe to binary search.

### 3. Timing side channel — the security payload

A simulated server checks a secret token. You choose which comparison it uses:

- **Vulnerable (early-exit)** — stops comparing at the first mismatching character, so the
  response time grows with the length of the matching prefix.
- **Hardened (constant-time)** — always inspects every character, so the response time is
  independent of the secret.

**Interactions**

- **Text box** — set the secret token (A–Z, 0–9).
- **Dropdown** — choose the comparison implementation.
- **Slider** — measurement/network jitter in nanoseconds (0–60).
- **Slider** — samples averaged per guess (1–500).
- **Text box + button** — measure a guess of your own and compare it against a guess that is
  wrong from the first character.
- **Button** — run the automated timing attack and watch the secret appear one character at a
  time, with a live bar chart of the average response time for each candidate character.

**Concept:** the attack reduces secret recovery from `O(k^n)` brute force to `O(k·n)` probing.
For a 6-character token over a 36-character alphabet, that is ~2.2 billion guesses versus a few
thousand requests. The module shows both numbers side by side as you change settings.

### 4. Defenses

A side-by-side code comparison of a leaking compare and a constant-time compare, plus a checklist
of real-world mitigations (vetted primitives such as `crypto.timingSafeEqual` /
`hmac.compare_digest` / `subtle.ConstantTimeCompare`, comparing HMACs instead of raw secrets,
keeping control flow independent of secret data, rate limiting, and awareness of other channels
such as cache, power, and compression side channels).

### 5. Check yourself

Four multiple-choice questions with immediate explanations and a running score.

---

## How the timing simulation works

Timings are **modelled**, not measured, so the lesson behaves identically on every machine:

```
cost(guess) = steps(guess) × 12 ns + gaussian_noise(jitter)
```

- **Early-exit compare:** `steps` = number of matching leading characters + 1 (capped at the
  secret length). A guess with a longer correct prefix therefore takes measurably longer.
- **Constant-time compare:** `steps` = secret length, always.
- Each measurement adds Gaussian noise (Box–Muller) with the standard deviation set by the jitter
  slider; averaging `s` samples shrinks the noise by a factor of `√s`, which is exactly why real
  attackers simply send more requests.
- The attacker pads candidate guesses with a character outside the alphabet so the compare always
  ends at the position under test.
- The **final** character produces no timing difference (the comparison ends either way), so the
  attack falls back on the plain accept/reject answer for it — a detail the module calls out
  explicitly on the last position.

---

## Suggested classroom flow (about 25 minutes)

1. **Set the stage (5 min).** Section 1 with the log-scale toggle off, then on. Ask students to
   predict the `O(2ⁿ)` runtime at `n = 64` before revealing the table.
2. **Make it concrete (5 min).** Run the race at 1,024 items. Count probes aloud.
3. **Break something (10 min).** In section 3, measure `AAAAAA` and then `CAXXXX` against the
   default secret and compare the two times. Then run the full attack. Ask:
   *what did the server leak? It only ever answered "no".*
4. **Fight back (5 min).** Raise the jitter to 60 and re-run — the attack becomes unreliable. Now
   raise samples to 500 and re-run — it succeeds again. Finally switch to the constant-time
   comparison: no sample count saves the attacker. Close with section 4 and the quiz.

### Discussion prompts

- Why is adding random delay a weaker defense than constant-time code?
- The secret length is assumed known. What does the vulnerable compare leak about length, and how
  would an attacker exploit that?
- Why does comparing HMACs of the two values make a leaked prefix useless?
- Which other observable quantities (cache timing, power draw, response size, error wording) could
  carry the same kind of signal?

---

## Extending the module

`app.js` is plain, commented ES2017 with no bundler. Useful starting points:

- Add complexity classes (for example `O(√n)` or `O(n!)`) to the `COMPLEXITIES` array.
- Change `NS_PER_COMPARISON` or the `respond()` cost model to demonstrate a different leak, such
  as a length-check leak or a cache-hit/miss leak.
- Extend `ALPHABET` to show how the attack cost grows linearly in `k` while brute force grows
  exponentially.
- Add questions to the `QUIZ` array.

---

## Responsible use

This module is for teaching defensive engineering. The "attack" targets a make-believe secret
stored in a local variable in your own browser tab. Do not use these techniques to probe systems
you do not own or have explicit permission to test.
