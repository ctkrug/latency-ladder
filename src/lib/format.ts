import type { LadderResult } from "../benchmarks";

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

/** Builds the plain-text shareable summary of a ladder run: one line per
 * tier (its formatted latency, or its error message if it failed) plus the
 * narrative line when at least two tiers succeeded. This is what "copy
 * result" puts on the clipboard. */
export function shareText(results: LadderResult[]): string {
  const lines = results.map((r) =>
    r.error !== null ? `${r.label}: ${r.error}` : `${r.label}: ${formatDuration(r.nsPerAccess!)}`,
  );

  let text = `Latency Ladder results:\n${lines.join("\n")}`;

  const ok = results.filter((r) => r.error === null);
  if (ok.length >= 2) {
    const slowest = ok[ok.length - 1]!;
    const fastest = ok[0]!;
    text += `\n\n${narrativeLine(
      slowest.label.toLowerCase(),
      slowest.nsPerAccess!,
      `${fastest.label.toLowerCase()} accesses`,
      fastest.nsPerAccess!,
    )}`;
  }

  return text;
}
