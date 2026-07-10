# Vision

## The problem

Every "memory hierarchy latency" chart that circulates online is the same
handful of numbers, measured once, on somebody else's machine, years ago:
"L1 ~1ns, RAM ~100ns, SSD ~100µs, network ~100ms." They're directionally
correct and personally meaningless — nobody looking at that chart is looking
at *their* laptop, *their* phone, *their* network. And the numbers are
presented as four disconnected facts rather than one story, so the
staggering scale of the gap between them never actually lands.

Getting honest, real numbers out of a browser sandbox is also legitimately
hard: JIT warm-up, GC pauses, prefetchers, and cache effects from the
benchmark's own bookkeeping can all quietly corrupt a naive "time a loop"
measurement. Most "benchmark your browser" demos either fake it with
canned numbers or measure something so contaminated by JS overhead that
the result is noise.

## Who it's for

Developers, students, and the technically curious who have an intuition that
"RAM is faster than the network" but have never seen *how much* faster, on
hardware they actually recognize as their own. It's a five-minute "huh, cool"
experience, not a benchmarking tool for professionals tuning production
systems.

## The core idea

One button — **measure me** — triggers four live micro-benchmarks against
the actual device the page is running on:

1. **Cache** — a pointer-chase kernel (compiled from AssemblyScript to
   WebAssembly, so the hot loop is immune to JIT warm-up/deopt during
   measurement) walks a randomized linked list sized to stay resident in L1.
2. **RAM** — the identical kernel, same code path, but with a working set
   sized well past any consumer last-level cache, forcing every access out
   to main memory.
3. **IndexedDB** — real put/get round-trips against a scratch object store.
4. **Network** — real fetch round-trips against the page's own origin.

Each tier runs many trials and reduces them with a trimmed mean, so a single
GC pause or scheduling hiccup doesn't wreck the result. The four numbers are
then rendered as bars on a shared **logarithmic** scale — because the true
range (nanoseconds to milliseconds, nine-plus orders of magnitude) makes a
linear chart useless, but a log chart makes the story visible — animating
into place in ascending order, ending on the wow line: *"your network
round-trip is slower than 40,000 of your own RAM accesses."* That sentence,
generated from the run's own numbers, is the whole point of the page.

## Key design decisions

- **AssemblyScript, not hand-written WAT or a Rust/wasm-pack toolchain.**
  It compiles TypeScript-like syntax straight to WASM via a pure npm
  dependency — no extra toolchain to install in CI, but still gets a
  benchmark kernel outside the JS engine's JIT variance.
- **Pointer chasing, not "read N bytes in a loop."** A sequential-read loop
  gets hidden by hardware prefetching and tells you nothing about latency.
  A pointer chase — each address depends on reading the previous one — is
  the standard technique for isolating true memory latency, and using the
  *same* kernel for both cache and RAM (only the working-set size differs)
  keeps the two tiers genuinely comparable.
- **Trimmed mean over raw average or single sample.** Browser tabs are
  noisy: GC, other tabs, thermal throttling. Dropping the top/bottom
  fraction of trials before averaging is the cheapest way to get a stable,
  repeatable number without a full statistical model.
- **Log-scale bars, not four separate stat cards.** Separate numbers read as
  trivia. One shared scale is what makes the relative gap emotionally
  legible — the whole "wow moment" depends on it.
- **Static site, zero backend.** Everything runs client-side; the "network"
  tier measures a same-origin fetch, which is honest about what a static
  site can measure without needing a server component of its own.

## What "v1 done" looks like

- All four tiers measure real, live numbers on the visitor's own device —
  no canned/fallback data path silently substituted in.
- The bars animate in on a shared log scale, settling in ascending order,
  followed by the generated narrative line.
- The page looks and feels intentionally designed (see `docs/DESIGN.md`),
  works at phone and desktop widths, and has real hover/focus/loading states
  — not a bare "it technically works" demo.
- A user can re-run the measurement and get a broadly consistent result
  (same order of magnitude) across repeated clicks on the same device.
- CI is green: type-checked, unit-tested, and the production build succeeds.
