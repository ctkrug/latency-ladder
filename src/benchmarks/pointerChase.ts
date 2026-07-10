import { loadKernel } from "../wasm/loader";

export interface PointerChaseResult {
  /** Nanoseconds per pointer dereference, trimmed-mean across trials. */
  nsPerAccess: number;
  workingSetBytes: number;
}

/**
 * Runs the WASM pointer-chase kernel over a working set of `sizeInts` 32-bit
 * slots (`sizeInts * 4` bytes), `steps` dereferences per trial, `trials`
 * times, and returns the per-access latency. Called at a small `sizeInts`
 * (fits in L1/L2) for the cache benchmark and a large one (exceeds LLC) for
 * the RAM benchmark — same kernel, different working-set size.
 */
export async function runPointerChase(
  sizeInts: number,
  steps: number,
  trials: number,
): Promise<number[]> {
  const kernel = await loadKernel();
  const ptr = kernel.alloc(sizeInts);
  kernel.buildRing(ptr, sizeInts, 0x2545f491);

  const nsPerTrial: number[] = [];
  try {
    for (let t = 0; t < trials; t++) {
      const start = performance.now();
      kernel.chase(ptr, sizeInts, steps);
      const elapsedMs = performance.now() - start;
      nsPerTrial.push((elapsedMs * 1_000_000) / steps);
    }
  } finally {
    kernel.dealloc(ptr);
  }

  return nsPerTrial;
}
