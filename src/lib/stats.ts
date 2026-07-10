/** Returns the trimmed mean of `values`, dropping `trim` fraction from each
 * tail before averaging. Robust to the scheduling jitter that a handful of
 * slow trials always introduce in a browser. */
export function trimmedMean(values: number[], trim = 0.2): number {
  if (values.length === 0) throw new Error("trimmedMean: values is empty");

  const sorted = [...values].sort((a, b) => a - b);
  const cut = Math.floor(sorted.length * trim);
  const kept = sorted.slice(cut, sorted.length - cut || sorted.length);

  return kept.reduce((sum, v) => sum + v, 0) / kept.length;
}

export function median(values: number[]): number {
  if (values.length === 0) throw new Error("median: values is empty");

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}
