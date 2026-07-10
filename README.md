# Latency Ladder

Click **measure me** and watch bars for cache, RAM, IndexedDB, and network round-trip
animate into place at true logarithmic scale — built from live micro-benchmarks of
*your* device, not a static reference chart pulled from someone else's machine.

The payoff line: *"your network round-trip is slower than 40,000 of your own RAM
accesses."* Every number on the page is measured, in your browser, right now.

## Why this exists

Every "memory hierarchy latency" chart on the internet is the same 15-year-old
numbers from a single benchmark someone ran once on a workstation you've never
touched. They're directionally right and personally meaningless. Latency Ladder
throws that chart away and measures the real thing, live, on the hardware you're
actually reading this on — then tells the story as one relatable scale instead of
four disconnected numbers.

## How it measures

- **Cache** — a pointer-chasing kernel compiled to WebAssembly (via AssemblyScript)
  walks a randomized linked list sized to blow past L1/L2/L3, isolating true cache-miss
  latency from JIT noise.
- **RAM** — the same pointer-chase kernel at a working-set size larger than any
  cache tier, forcing main-memory access.
- **IndexedDB** — round-trip timing of real reads/writes against a scratch
  object store, median-of-many to smooth out browser scheduling jitter.
- **Network** — round-trip timing of small fetches against the page's own origin.

All four run as repeated trials in a Web Worker so the UI thread stays responsive,
then get reduced to a robust (trimmed-median) estimate before rendering.

## Stack

- **TypeScript** for the app shell, UI, and benchmark orchestration.
- **AssemblyScript → WebAssembly** for the cache/RAM pointer-chase kernel, so the
  hot loop isn't at the mercy of JIT warm-up or deopt during measurement.
- **Vite** for dev/build tooling, output as a single static bundle.
- **Vitest** for unit tests.

## Planned features

- [ ] Pointer-chase WASM kernel with configurable working-set size
- [ ] Cache/RAM/IndexedDB/network benchmark runners with outlier-resistant reduction
- [ ] Logarithmic-scale animated bar chart, bars settle in measured order
- [ ] "X is slower than Y of your own Z" narrative line generated from live numbers
- [ ] Re-run / compare-to-last-run
- [ ] Shareable result card

See [`docs/VISION.md`](docs/VISION.md) for the full design rationale and
[`docs/BACKLOG.md`](docs/BACKLOG.md) for the build plan.

## Development

```bash
npm install
npm run build:wasm   # compile the AssemblyScript kernel
npm run dev           # start the Vite dev server
npm test              # run the unit tests
npm run build          # production build to dist/
```

## License

MIT — see [`LICENSE`](LICENSE).
