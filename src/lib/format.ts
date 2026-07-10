/** Formats a duration in nanoseconds as a human-readable string, picking
 * ns/µs/ms/s automatically. */
export function formatDuration(ns: number): string {
  if (ns < 1_000) return `${ns.toFixed(0)} ns`;
  if (ns < 1_000_000) return `${(ns / 1_000).toFixed(1)} µs`;
  if (ns < 1_000_000_000) return `${(ns / 1_000_000).toFixed(1)} ms`;
  return `${(ns / 1_000_000_000).toFixed(2)} s`;
}

/** Formats a count with thousands separators, e.g. 40000 -> "40,000". */
export function formatCount(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

/** Builds the "X is slower than Y of your own Z" narrative line. */
export function narrativeLine(
  slowerLabel: string,
  slowerNs: number,
  fasterLabel: string,
  fasterNs: number,
): string {
  const ratio = slowerNs / fasterNs;
  return `Your ${slowerLabel} is slower than ${formatCount(ratio)} of your own ${fasterLabel}.`;
}
