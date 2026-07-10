import { trimmedMean } from "../lib/stats";
import { runPointerChase } from "./pointerChase";

// 4,096 32-bit slots = 16 KB, comfortably inside a typical 32-128 KB L1
// data cache, so this isolates cache-hit latency rather than a cache miss.
const CACHE_WORKING_SET_INTS = 4_096;
const STEPS_PER_TRIAL = 200_000;
const TRIALS = 12;

export async function benchmarkCache(): Promise<number> {
  const samples = await runPointerChase(CACHE_WORKING_SET_INTS, STEPS_PER_TRIAL, TRIALS);
  return trimmedMean(samples);
}
