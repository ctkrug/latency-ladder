// Pointer-chase micro-benchmark kernel.
//
// The caller builds a randomized cyclic permutation of `size` 32-bit slots
// (so each read address depends on the previous one — no prefetcher or
// compiler optimization can hide the true memory latency) and this kernel
// walks it `steps` times, returning the final index. The TS side times the
// call with performance.now() and divides by `steps` to get per-access
// latency at whatever working-set size it chose (small = cache-resident,
// large = RAM-resident).

export function chase(bufPtr: usize, size: i32, steps: i32): i32 {
  let idx: i32 = 0;
  for (let i: i32 = 0; i < steps; i++) {
    idx = load<i32>(bufPtr + (<usize>idx << 2));
  }
  return idx;
}

// Builds a random cyclic permutation of [0, size) into the buffer at bufPtr,
// using a simple xorshift PRNG seeded by the caller so results are
// reproducible run-to-run for the same seed.
export function buildRing(bufPtr: usize, size: i32, seed: i32): void {
  let state: i32 = seed == 0 ? 1 : seed;

  for (let i: i32 = 0; i < size; i++) {
    store<i32>(bufPtr + (<usize>i << 2), i);
  }

  // Fisher-Yates shuffle using xorshift32.
  for (let i: i32 = size - 1; i > 0; i--) {
    state ^= state << 13;
    state ^= state >> 17;
    state ^= state << 5;
    const j: i32 = (state < 0 ? -state : state) % (i + 1);

    const tmp: i32 = load<i32>(bufPtr + (<usize>i << 2));
    store<i32>(bufPtr + (<usize>i << 2), load<i32>(bufPtr + (<usize>j << 2)));
    store<i32>(bufPtr + (<usize>j << 2), tmp);
  }
}

export function alloc(size: i32): usize {
  return heap.alloc(<usize>size << 2);
}

export function dealloc(ptr: usize): void {
  heap.free(ptr);
}
