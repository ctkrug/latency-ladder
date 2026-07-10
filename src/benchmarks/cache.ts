import { trimmedMean } from "../lib/stats";
import { runPointerChase } from "./pointerChase";

// 4,096 32-bit slots = 16 KB, comfortably inside a typical 32-128 KB L1
// data cache, so this isolates cache-hit latency rather than a cache miss.
export const CACHE_WORKING_SET_INTS = 4_096;
const STEPS_PER_TRIAL = 200_000;
// A cache-tier trial completes in well under a millisecond, so doubling the
// trial count over the other tiers' 12-15 is nearly free wall-clock time
// and meaningfully improves trimmed-mean stability: at 12 trials a single
// scheduler stall (only ~2 trials get trimmed off each tail) can swing the
// result 40%+; at 24 trials (4-5 trimmed off each tail) repeated runs agree
// within single-digit percent.
const TRIALS = 24;

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
