import { trimmedMean } from "../lib/stats";
import { runPointerChase } from "./pointerChase";

// 16M 32-bit slots = 64 MB, well past any consumer LLC (typically 8-32 MB),
// so the pointer chase is forced out to main memory on every access.
export const RAM_WORKING_SET_INTS = 16 * 1024 * 1024;
const STEPS_PER_TRIAL = 200_000;
const TRIALS = 12;

/** Raw per-trial ns/access samples, before outlier trimming. */
export async function sampleRam(sizeInts: number = RAM_WORKING_SET_INTS): Promise<number[]> {
  return runPointerChase(sizeInts, STEPS_PER_TRIAL, TRIALS);
}

export async function benchmarkRam(): Promise<number> {
  return trimmedMean(await sampleRam());
}
