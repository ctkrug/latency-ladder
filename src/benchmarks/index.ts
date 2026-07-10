import { benchmarkCache } from "./cache";
import { benchmarkIndexedDb } from "./indexeddb";
import { benchmarkNetwork } from "./network";
import { benchmarkRam } from "./ram";

export interface LadderResult {
  label: string;
  nsPerAccess: number;
}

/** Runs all four tiers and returns them ascending by latency — the order
 * the bars animate in and the order the ladder narrative reads in. */
export async function runLadder(): Promise<LadderResult[]> {
  const [cache, ram, indexedDb, network] = await Promise.all([
    benchmarkCache(),
    benchmarkRam(),
    benchmarkIndexedDb(),
    benchmarkNetwork(),
  ]);

  const results: LadderResult[] = [
    { label: "Cache", nsPerAccess: cache },
    { label: "RAM", nsPerAccess: ram },
    { label: "IndexedDB", nsPerAccess: indexedDb },
    { label: "Network", nsPerAccess: network },
  ];

  return results.sort((a, b) => a.nsPerAccess - b.nsPerAccess);
}
