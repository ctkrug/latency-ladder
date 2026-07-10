import { afterEach, describe, expect, it, vi } from "vitest";

const { loadKernel } = vi.hoisted(() => ({ loadKernel: vi.fn() }));
vi.mock("../src/wasm/loader", () => ({ loadKernel }));

import { RAM_WORKING_SET_INTS, benchmarkRam, sampleRam } from "../src/benchmarks/ram";

function fakeKernel() {
  let n = 0;
  return {
    memory: {} as WebAssembly.Memory,
    alloc: vi.fn(() => 0),
    dealloc: vi.fn(),
    buildRing: vi.fn(),
    chase: vi.fn(() => n++),
  };
}

describe("sampleRam / benchmarkRam", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("samples at the tuned working-set size by default", async () => {
    const kernel = fakeKernel();
    loadKernel.mockResolvedValue(kernel);

    const samples = await sampleRam();

    expect(samples.length).toBeGreaterThan(0);
    expect(kernel.buildRing).toHaveBeenCalledWith(0, RAM_WORKING_SET_INTS, expect.any(Number));
  });

  it("benchmarkRam reduces the raw samples with a trimmed mean", async () => {
    loadKernel.mockResolvedValue(fakeKernel());

    const ns = await benchmarkRam();

    expect(Number.isFinite(ns)).toBe(true);
    expect(ns).toBeGreaterThanOrEqual(0);
  });
});
