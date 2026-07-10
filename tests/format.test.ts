import { describe, expect, it } from "vitest";
import { formatCount, formatDuration, narrativeLine, shareText } from "../src/lib/format";
import type { LadderResult } from "../src/benchmarks";

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

  it("degrades to an infinity symbol rather than crashing when the faster tier measured 0", () => {
    // A coarse timer can round an extremely fast trial down to exactly 0ns.
    // The ratio is then Infinity, not NaN — toLocaleString renders it as
    // "∞" instead of throwing or printing "NaN", which is a readable (if
    // unusual) fallback rather than a broken narrative line.
    expect(narrativeLine("network round-trip", 100_000_000, "cache accesses", 0)).toBe(
      "Your network round-trip is slower than ∞ of your own cache accesses.",
    );
  });
});

describe("shareText", () => {
  it("lists every successful tier with its formatted latency", () => {
    const results: LadderResult[] = [
      { label: "Cache", nsPerAccess: 1, error: null },
      { label: "RAM", nsPerAccess: 100, error: null },
    ];
    const text = shareText(results);
    expect(text).toContain("Cache: 1 ns");
    expect(text).toContain("RAM: 100 ns");
  });

  it("includes the narrative line when at least two tiers succeeded", () => {
    const results: LadderResult[] = [
      { label: "RAM", nsPerAccess: 2_500, error: null },
      { label: "Network", nsPerAccess: 100_000_000, error: null },
    ];
    expect(shareText(results)).toContain(
      "Your network is slower than 40,000 of your own ram accesses.",
    );
  });

  it("omits the narrative line when fewer than two tiers succeeded", () => {
    const results: LadderResult[] = [
      { label: "Cache", nsPerAccess: 1, error: null },
      { label: "RAM", nsPerAccess: null, error: "WebAssembly unsupported in this browser" },
    ];
    const text = shareText(results);
    expect(text).toContain("RAM: WebAssembly unsupported in this browser");
    expect(text).not.toContain("slower than");
  });
});
