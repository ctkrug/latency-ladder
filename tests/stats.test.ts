import { describe, expect, it } from "vitest";
import { median, trimmedMean } from "../src/lib/stats";

describe("trimmedMean", () => {
  it("drops outliers from both tails", () => {
    // Without trimming, the mean would be dragged up to ~169 by the 1000
    // outlier; trimming the top/bottom 20% leaves [2, 3, 4, 5].
    expect(trimmedMean([1, 2, 3, 4, 5, 1000], 0.2)).toBeCloseTo(3.5, 5);
  });

  it("averages plainly when trim is 0", () => {
    expect(trimmedMean([1, 2, 3], 0)).toBeCloseTo(2, 5);
  });

  it("throws on empty input", () => {
    expect(() => trimmedMean([])).toThrow();
  });

  it("throws instead of returning NaN when trim consumes the whole input", () => {
    // trim=0.5 on a 4-element array cuts 2 from each tail, leaving nothing —
    // previously this silently divided 0/0 into NaN.
    expect(() => trimmedMean([1, 2, 3, 4], 0.5)).toThrow(/no values/);
  });

  it("keeps the middle values when trim is just below the whole-array boundary", () => {
    expect(trimmedMean([1, 2, 3, 4, 5], 0.4)).toBeCloseTo(3, 5);
  });
});

describe("median", () => {
  it("returns the middle value for odd-length input", () => {
    expect(median([5, 1, 3])).toBe(3);
  });

  it("averages the two middle values for even-length input", () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
});
