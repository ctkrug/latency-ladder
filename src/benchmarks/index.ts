import { benchmarkCache } from "./cache";
import { benchmarkIndexedDb } from "./indexeddb";
import { benchmarkNetwork } from "./network";
import { benchmarkRam } from "./ram";

export interface LadderResult {
  label: string;
  /** null when the tier failed — see `error`. */
  nsPerAccess: number | null;
  /** Human-readable failure reason, null when the tier succeeded. */
  error: string | null;
}

interface Tier {
  label: string;
  run: () => Promise<number>;
}

const TIERS: Tier[] = [
  { label: "Cache", run: benchmarkCache },
  { label: "RAM", run: benchmarkRam },
  { label: "IndexedDB", run: benchmarkIndexedDb },
  { label: "Network", run: benchmarkNetwork },
];

/** Runs all four tiers independently — one tier throwing never stops the
 * others — and returns successful tiers ascending by latency (the order the
 * bars animate in) followed by any failed tiers in their fixed definition
 * order. */
export async function runLadder(): Promise<LadderResult[]> {
  const settled = await Promise.allSettled(TIERS.map((tier) => tier.run()));

  const results: LadderResult[] = settled.map((outcome, i) => {
    const label = TIERS[i]!.label;
    if (outcome.status === "fulfilled") {
      return { label, nsPerAccess: outcome.value, error: null };
    }
    const reason = outcome.reason;
    return {
      label,
      nsPerAccess: null,
      error: reason instanceof Error ? reason.message : String(reason),
    };
  });

  const ok = results.filter((r) => r.error === null).sort((a, b) => a.nsPerAccess! - b.nsPerAccess!);
  const failed = results.filter((r) => r.error !== null);

  return [...ok, ...failed];
}
