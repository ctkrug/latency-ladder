import { trimmedMean } from "../lib/stats";
import { runPointerChase } from "./pointerChase";

// 4,096 32-bit slots = 16 KB, comfortably inside a typical 32-128 KB L1
// data cache, so this isolates cache-hit latency rather than a cache miss.
export const CACHE_WORKING_SET_INTS = 4_096;
const STEPS_PER_TRIAL = 200_000;
const TRIALS = 12;

/** Raw per-trial ns/access samples, before outlier trimming. `sizeInts`
 * defaults to the tier's tuned working set but is overridable so callers
 * can validate the tuning itself (e.g. confirm a smaller working set still
 * reports cache-resident latency). */
export async function sampleCache(sizeInts: number = CACHE_WORKING_SET_INTS): Promise<number[]> {
  return runPointerChase(sizeInts, STEPS_PER_TRIAL, TRIALS);
}

export async function benchmarkCache(): Promise<number> {
  return trimmedMean(await sampleCache());
}
