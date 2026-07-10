# Architecture

A concise map of the codebase for anyone picking this project back up.

## Stack

- TypeScript + Vite for the app shell and build.
- AssemblyScript compiled to WebAssembly for the cache/RAM pointer-chase kernel.
- Vitest + jsdom (+ fake-indexeddb) for unit tests.
- No framework, no backend — a static bundle served from `dist/`.

## How to run it

```bash
npm install
npm run build:wasm   # compile assembly/index.ts -> src/wasm/kernel.wasm
npm run dev           # Vite dev server
npm test               # vitest run
npm run build           # build:wasm + typecheck + vite build -> dist/
```

`npm run build` is also what CI (`.github/workflows/ci.yml`) runs.

## Data flow

```
click #measure
  -> runLadder()                         src/benchmarks/index.ts
       -> benchmarkCache()  \
       -> benchmarkRam()     } Promise.allSettled, run concurrently
       -> benchmarkIndexedDb()
       -> benchmarkNetwork() /
     each tier returns a trimmed-mean ns/access number, or the tier's
     promise rejects and becomes a labeled error row instead
  -> LadderResult[] sorted: successful tiers ascending by latency,
     then failed tiers, in runLadder()
  -> renderBars(container, ladder, { previous, onBarLanded })  src/ui/bars.ts
       - log10-scales successful tiers onto one 0-100% bar width
       - error tiers render as a label + message row instead of a bar
       - each bar's fill gets a staggered transition-delay (BAR_STAGGER_MS
         apart) and reports back via onBarLanded when it lands
       - a `previous` run draws a faint marker + delta label per tier
  -> narrativeLine(...) + shareText(...)                        src/lib/format.ts
  -> playTick(step) per landed bar, mute toggle                 src/audio/sfx.ts
```

## Module map

```
assembly/index.ts        AssemblyScript source for the pointer-chase kernel
                          (chase/buildRing/alloc/dealloc), compiled to
                          src/wasm/kernel.wasm by `npm run build:wasm`.
src/wasm/loader.ts        Fetches + instantiates kernel.wasm once, shared by
                          cache.ts and ram.ts. Throws a labeled error if
                          WebAssembly is unavailable.
src/benchmarks/
  pointerChase.ts          Runs the WASM kernel for `trials` timed passes at
                            a given working-set size and returns per-trial
                            ns/access samples.
  cache.ts / ram.ts         Same kernel, different working-set size (16KB vs
                            64MB) so one is cache-resident and one isn't.
  indexeddb.ts               Real put/get round-trips against a scratch
                              object store; warms the connection with an
                              untimed round-trip first.
  network.ts                  Real same-origin fetch round-trips, cache-
                              busted with a unique query string per trial.
  index.ts                     runLadder(): fans out the four tiers with
                                Promise.allSettled and sorts the result.

  Each tier module exports both a raw-samples function (`sampleCache`,
  `sampleRam`, `sampleIndexedDb`, `sampleNetwork`) returning the untrimmed
  per-trial array, and a `benchmark*` wrapper that reduces it with
  `trimmedMean`. `runLadder` only calls the `benchmark*` wrappers; the raw
  variants exist so trial data can be inspected directly (e.g. to validate
  outlier handling or working-set tuning against real distributions rather
  than synthetic test arrays).
src/lib/
  stats.ts     trimmedMean / median — outlier-resistant reducers.
  format.ts    formatDuration / formatCount / narrativeLine / shareText.
  motion.ts    prefersReducedMotion() — guards matchMedia for jsdom/old
               browsers.
  clipboard.ts copyText() — Clipboard API with an execCommand fallback.
src/audio/sfx.ts  Synthesized WebAudio tick (oscillator + gain envelope),
                  lazy AudioContext creation, localStorage-backed mute.
src/ui/bars.ts     renderBars() — the log-scale bar chart, error rows,
                    stagger, and previous-run comparison markers.
src/main.ts         Wires the DOM: button/mute/copy handlers, tracks the
                    previous run in module state, builds the narrative and
                    copy-result UI after each measurement.
src/style.css        Design tokens (docs/DESIGN.md) and all component
                      styles, including the blueprint-grid background and
                      responsive breakpoints.
```

## Testing approach

Every module under `src/lib`, `src/benchmarks`, `src/audio`, and `src/ui`
has a matching file in `tests/`. Notable patterns:

- `tests/ladder.test.ts` mocks the four tier modules to test `runLadder`'s
  ordering/error-partitioning logic without touching WASM/IndexedDB/network.
- `tests/indexeddb.test.ts` uses `fake-indexeddb/auto` for a real (in-memory)
  IndexedDB implementation under jsdom.
- `tests/sfx.test.ts` and `tests/clipboard.test.ts` fake the relevant Web
  APIs (`AudioContext`, `navigator.clipboard`, `document.execCommand`) since
  jsdom doesn't implement them.
- `tests/bars.test.ts` drives `renderBars` directly against a detached DOM
  node and asserts on the rendered markup/styles rather than pixels.
- `tests/main.test.ts` mocks `runLadder`/`audio/sfx`/`lib/clipboard` and
  drives the real click handlers against a mounted `#app` tree, covering
  the wiring itself (previous-run tracking, mute toggle, copy button) —
  distinct from `tests/bars.test.ts`, which covers `renderBars` in
  isolation.
- `tests/kernel.test.ts` instantiates the real compiled `kernel.wasm`
  (not a mock) via Node's `WebAssembly`, to catch bugs in `buildRing`'s
  actual shuffle logic that a mocked-kernel test can't see — this is what
  caught the Fisher-Yates/Sattolo cycle-fragmentation bug.

Design self-review (see the design standard) and the production build cover
the visual/manual side main.ts's wiring doesn't.

## Deployment

The Vite config sets `base: "./"` and all asset references are relative, so
`dist/` can be served from any subpath (verified by serving it from a
`/latency-ladder/`-named subdirectory with `python3 -m http.server`) —
required for `apps.charliekrug.com/latency-ladder/`.

- `site_build_dir`: `dist`
- `build_cmd`: `npm run build`
