import { afterEach, describe, expect, it, vi } from "vitest";

const { loadKernel } = vi.hoisted(() => ({ loadKernel: vi.fn() }));
vi.mock("../src/wasm/loader", () => ({ loadKernel }));

import { CACHE_WORKING_SET_INTS, benchmarkCache, sampleCache } from "../src/benchmarks/cache";

function fakeKernel() {
  let n = 0;
  return {
    memory: {} as WebAssembly.Memory,
    alloc: vi.fn(() => 0),
    dealloc: vi.fn(),
    buildRing: vi.fn(),
    // A monotonically increasing return value stands in for elapsed wall
    // time so trimmedMean has non-degenerate samples to reduce.
    chase: vi.fn(() => n++),
  };
}

describe("sampleCache / benchmarkCache", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("samples at the tuned working-set size by default", async () => {
    const kernel = fakeKernel();
    loadKernel.mockResolvedValue(kernel);

    const samples = await sampleCache();

    expect(samples.length).toBeGreaterThan(0);
    expect(kernel.buildRing).toHaveBeenCalledWith(0, CACHE_WORKING_SET_INTS, expect.any(Number));
  });

  it("accepts an override working-set size for tuning validation", async () => {
    const kernel = fakeKernel();
    loadKernel.mockResolvedValue(kernel);

    await sampleCache(CACHE_WORKING_SET_INTS / 2);

    expect(kernel.buildRing).toHaveBeenCalledWith(0, CACHE_WORKING_SET_INTS / 2, expect.any(Number));
  });

  it("benchmarkCache reduces the raw samples with a trimmed mean", async () => {
    loadKernel.mockResolvedValue(fakeKernel());

    const ns = await benchmarkCache();

    expect(Number.isFinite(ns)).toBe(true);
    expect(ns).toBeGreaterThanOrEqual(0);
  });
});
