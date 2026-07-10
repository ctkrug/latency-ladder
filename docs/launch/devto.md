---
title: "I measured my laptop's memory hierarchy in the browser, and the network gap is absurd"
published: false
tags: webassembly, performance, typescript, javascript
---

Every developer has seen the chart. L1 cache is about a nanosecond, main memory is
about a hundred, an SSD is tens of microseconds, and a network round-trip is
milliseconds. It usually shows up as "latency numbers every programmer should know,"
and it is genuinely useful for building intuition.

But those numbers were measured once, on one machine, years ago. They are not *your*
numbers. And they are almost always presented as four disconnected facts, so the thing
that actually matters, how staggeringly far apart the tiers are, never lands.

So I built [Latency Ladder](https://apps.charliekrug.com/latency-ladder/): click one
button and it runs four live micro-benchmarks on the device you are reading this on, then
draws them on a single logarithmic scale. The payoff is a sentence generated from your own
run, something like "your network round-trip is slower than 40,000 of your own RAM
accesses."

Two build decisions were more interesting than I expected.

## 1. You cannot measure memory latency with a normal loop

The naive approach is to allocate an array and read it in a loop while timing. This tells
you almost nothing, because the hardware prefetcher sees the sequential access pattern and
streams the data in ahead of your reads. You end up measuring bandwidth, not latency.

The standard fix is pointer chasing. You build a randomized cyclic permutation of indices,
then walk it so that each read address is the value you just read:

```
idx = buffer[idx]
```

Now every read depends on the previous one. The prefetcher cannot guess where you are
going next, so each access pays the full latency of whatever level of the hierarchy the
data lives in. Run it against a 16&nbsp;KB working set and it stays resident in L1, so you
measure cache latency. Run the exact same code against a 64&nbsp;MB working set and every
access spills to main memory, so you measure RAM latency. Same kernel, one variable.

One subtlety bit me here. To force every access out to memory, the permutation has to be a
*single* cycle that touches every slot. A plain Fisher-Yates shuffle can fragment into
several disjoint cycles, and the walk starting at index 0 might only ever visit a small
subset, silently shrinking the working set back into cache. The fix is Sattolo's algorithm,
which draws the swap index from `[0, i)` instead of `[0, i]`, guaranteeing exactly one
cycle over all slots. I only caught this because a test instantiates the real compiled
kernel and checks the ring, not a mock.

## 2. Keep the hot loop out of the JIT's way

Timing a tight loop in plain JavaScript is noisy. The JIT warms up, deoptimizes, and
reoptimizes mid-measurement, and you see it as variance. I wrote the pointer-chase kernel
in AssemblyScript and compiled it to WebAssembly, so the measured loop is stable machine
code with predictable performance from the first call.

AssemblyScript was the right amount of tool for this. It compiles TypeScript-like syntax
straight to WebAssembly as a plain npm dependency, so there is no Rust toolchain or extra
CI step, but I still get the hot loop outside the JS engine's JIT variance.

Everything else is small on purpose. Each tier runs many trials and reduces them with a
trimmed mean (drop the top and bottom 20%) so a single GC pause does not wreck the result.
The four numbers animate onto one log scale because a linear axis would collapse cache and
RAM into invisible slivers next to the network bar. The whole thing is a static site with
no backend; the network tier just times a small same-origin fetch, which is an honest thing
for a static page to measure.

## What I would do differently

The measurements are order-of-magnitude honest, not lab-grade. Browser timers are
coarsened for security reasons, so I cannot resolve a true 1&nbsp;ns cache hit precisely; I
can only show that cache is roughly two orders of magnitude faster than RAM and that RAM is
another few orders faster than the network. If I revisit it, I would move the benchmark
into a Web Worker to get away from main-thread scheduling noise, and add a storage tier
(OPFS) between IndexedDB and the network.

Code and full write-up are on [GitHub](https://github.com/ctkrug/latency-ladder). Try it on
your own machine and tell me how wide your ladder is:
[apps.charliekrug.com/latency-ladder](https://apps.charliekrug.com/latency-ladder/).
</content>
