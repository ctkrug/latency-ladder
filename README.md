# Latency Ladder

**▶ Live demo — [apps.charliekrug.com/latency-ladder](https://apps.charliekrug.com/latency-ladder/)**

The memory hierarchy, measured on your machine. Click **measure me** and watch bars
for cache, RAM, IndexedDB, and network round-trip animate into place on one logarithmic
scale, built from live micro-benchmarks of *your* device rather than a static reference
chart pulled from someone else's workstation.

[![CI](https://github.com/ctkrug/latency-ladder/actions/workflows/ci.yml/badge.svg)](https://github.com/ctkrug/latency-ladder/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

The payoff line reads back the run's own numbers: *"your network round-trip is slower
than 40,000 of your own RAM accesses."* Every figure on the page is measured, in your
browser, right now.

## Who it's for

You've seen the "latency numbers every programmer should know" chart: L1 ~1ns, RAM
~100ns, network ~100ms. Those numbers were measured once, years ago, on a machine you've
never touched. Latency Ladder measures the real thing on the hardware you're reading this
on and tells the story as one scale instead of four disconnected facts, so the size of
the gaps actually lands.

## Sample output

Every run has a copy-to-clipboard summary. A run on a 2021 laptop looks like this:

```
Latency Ladder results:
Cache: 1.2 ns
RAM: 92.0 ns
IndexedDB: 118.4 µs
Network: 3.6 ms

Your network is slower than 39,130 of your own cache accesses.
```

The bars for those four numbers span nine orders of magnitude, which is exactly why they
render on a log scale. On a linear axis, cache and RAM would both be invisible slivers
next to network.

## How it measures

- **Cache:** a pointer-chasing kernel compiled to WebAssembly (via AssemblyScript)
  walks a randomized linked list sized to stay resident in L1, isolating true
  cache-hit latency from JIT noise.
- **RAM:** the same pointer-chase kernel at a working-set size well past any
  consumer last-level cache, forcing every access out to main memory.
- **IndexedDB:** round-trip timing of real reads/writes against a scratch
  object store, warmed with an untimed round-trip first to exclude cold-open
  overhead from the measurement.
- **Network:** round-trip timing of small same-origin fetches, cache-busted so each
  one is a real round-trip rather than a browser cache hit.

All four run repeated trials, then get reduced with a trimmed mean (drop the top and
bottom 20% before averaging) to smooth out GC pauses and scheduling jitter before
rendering.

## Stack

- **TypeScript** for the app shell, UI, and benchmark orchestration.
- **AssemblyScript to WebAssembly** for the cache/RAM pointer-chase kernel, so the
  hot loop isn't at the mercy of JIT warm-up or deopt during measurement.
- **Vite** for dev/build tooling, output as a single static bundle.
- **Vitest** for unit tests (99% line coverage).

## Features

- [x] Pointer-chase WASM kernel with configurable working-set size
- [x] Cache/RAM/IndexedDB/network benchmark runners with outlier-resistant reduction
- [x] Logarithmic-scale animated bar chart, bars settle in measured order
- [x] "X is slower than Y of your own Z" narrative line generated from live numbers
- [x] Re-run / compare-to-last-run (faint reference marker + delta per tier)
- [x] Shareable result card (copy to clipboard)
- [x] Synthesized WebAudio bar-landing ticks with a persisted mute toggle
- [x] Graceful degradation when WebAssembly/IndexedDB/network is unavailable

## Development

```bash
npm install
npm run build:wasm    # compile the AssemblyScript kernel to src/wasm/kernel.wasm
npm run dev           # start the Vite dev server on :5173
npm test              # run the unit tests
npm run test:coverage # run them with a coverage report
npm run build         # production build to dist/
```

`npm run build` is exactly what CI runs: WASM compile, type-check, then Vite build.

See [`docs/VISION.md`](docs/VISION.md) for the full design rationale,
[`docs/DESIGN.md`](docs/DESIGN.md) for the visual direction, and
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the module map and data flow.

## License

MIT. See [`LICENSE`](LICENSE).

---

More of Charlie's projects → [apps.charliekrug.com](https://apps.charliekrug.com)
</content>
