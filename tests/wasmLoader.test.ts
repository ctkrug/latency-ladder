import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const KERNEL_BYTES = readFileSync(path.resolve(__dirname, "../src/wasm/kernel.wasm"));

async function freshLoader() {
  vi.resetModules();
  return import("../src/wasm/loader");
}

describe("loadKernel", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects with a clear message when WebAssembly is unavailable", async () => {
    const original = globalThis.WebAssembly;
    // @ts-expect-error simulating a browser without WASM support
    delete globalThis.WebAssembly;

    try {
      const { loadKernel } = await freshLoader();
      await expect(loadKernel()).rejects.toThrow(/unsupported/i);
    } finally {
      globalThis.WebAssembly = original;
    }
  });

  it("fetches and instantiates the real kernel.wasm into working exports", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response(KERNEL_BYTES))),
    );

    const { loadKernel } = await freshLoader();
    const kernel = await loadKernel();

    const ptr = kernel.alloc(64);
    try {
      kernel.buildRing(ptr, 64, 42);
      const result = kernel.chase(ptr, 64, 64);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(64);
    } finally {
      kernel.dealloc(ptr);
    }
  });

  it("fetches only once across repeated calls (memoized)", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response(KERNEL_BYTES)));
    vi.stubGlobal("fetch", fetchMock);

    const { loadKernel } = await freshLoader();
    await loadKernel();
    await loadKernel();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
