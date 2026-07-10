import { afterEach, describe, expect, it, vi } from "vitest";
import { runPointerChase } from "../src/benchmarks/pointerChase";

const { loadKernel } = vi.hoisted(() => ({ loadKernel: vi.fn() }));
vi.mock("../src/wasm/loader", () => ({ loadKernel }));

function fakeKernel() {
  return {
    memory: {} as WebAssembly.Memory,
    alloc: vi.fn(() => 0),
    dealloc: vi.fn(),
    buildRing: vi.fn(),
    chase: vi.fn(() => 0),
  };
}

describe("runPointerChase", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns one nanosecond-per-access sample per trial", async () => {
    loadKernel.mockResolvedValue(fakeKernel());

    const samples = await runPointerChase(4_096, 200_000, 12);

    expect(samples).toHaveLength(12);
    samples.forEach((s) => expect(Number.isFinite(s)).toBe(true));
  });

  it("builds the ring once and deallocates after the run, even if a trial throws", async () => {
    const kernel = fakeKernel();
    kernel.chase.mockImplementationOnce(() => {
      throw new Error("boom");
    });
    loadKernel.mockResolvedValue(kernel);

    await expect(runPointerChase(4_096, 200_000, 3)).rejects.toThrow("boom");

    expect(kernel.buildRing).toHaveBeenCalledTimes(1);
    expect(kernel.dealloc).toHaveBeenCalledTimes(1);
  });
});
