/** Returns the trimmed mean of `values`, dropping `trim` fraction from each
 * tail before averaging. Robust to the scheduling jitter that a handful of
 * slow trials always introduce in a browser. */
export function trimmedMean(values: number[], trim = 0.2): number {
  if (values.length === 0) throw new Error("trimmedMean: values is empty");

  const sorted = [...values].sort((a, b) => a - b);
  const cut = Math.floor(sorted.length * trim);
  const kept = sorted.slice(cut, sorted.length - cut);

  // A trim fraction large enough to consume the whole array (e.g. 0.5 on a
  // small input) would otherwise silently divide 0/0 into NaN.
  if (kept.length === 0) {
    throw new Error(`trimmedMean: trim ${trim} leaves no values for input length ${sorted.length}`);
  }

  return kept.reduce((sum, v) => sum + v, 0) / kept.length;
}
