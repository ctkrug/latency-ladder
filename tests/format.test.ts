import { describe, expect, it } from "vitest";
import { formatCount, formatDuration, narrativeLine } from "../src/lib/format";

describe("formatDuration", () => {
  it("formats sub-microsecond durations in ns", () => {
    expect(formatDuration(42)).toBe("42 ns");
  });

  it("formats microsecond durations in µs", () => {
    expect(formatDuration(4_200)).toBe("4.2 µs");
  });

  it("formats millisecond durations in ms", () => {
    expect(formatDuration(4_200_000)).toBe("4.2 ms");
  });

  it("formats second-scale durations in s", () => {
    expect(formatDuration(4_200_000_000)).toBe("4.20 s");
  });
});

describe("formatCount", () => {
  it("adds thousands separators", () => {
    expect(formatCount(40_000)).toBe("40,000");
  });

  it("rounds fractional counts", () => {
    expect(formatCount(1_234.6)).toBe("1,235");
  });
});

describe("narrativeLine", () => {
  it("builds the ratio sentence", () => {
    expect(narrativeLine("network round-trip", 100_000_000, "RAM accesses", 2_500)).toBe(
      "Your network round-trip is slower than 40,000 of your own RAM accesses.",
    );
  });
});
