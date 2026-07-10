import { trimmedMean } from "../lib/stats";

const TRIALS = 15;
// Same-origin, cache-busted so each request is a real round-trip rather
// than a browser cache hit.
const PROBE_PATH = "./favicon.svg";

/** Round-trips a tiny same-origin request `TRIALS` times and returns the
 * raw per-trial latencies in nanoseconds, before outlier trimming. */
export async function sampleNetwork(): Promise<number[]> {
  const samplesNs: number[] = [];

  for (let i = 0; i < TRIALS; i++) {
    const url = `${PROBE_PATH}?probe=${i}`;
    const start = performance.now();
    await fetch(url, { cache: "no-store" });
    samplesNs.push((performance.now() - start) * 1_000_000);
  }

  return samplesNs;
}

export async function benchmarkNetwork(): Promise<number> {
  return trimmedMean(await sampleNetwork());
}
