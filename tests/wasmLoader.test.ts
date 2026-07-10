import { describe, expect, it } from "vitest";
import { loadKernel } from "../src/wasm/loader";

describe("loadKernel", () => {
  it("rejects with a clear message when WebAssembly is unavailable", async () => {
    const original = globalThis.WebAssembly;
    // @ts-expect-error simulating a browser without WASM support
    delete globalThis.WebAssembly;

    try {
      await expect(loadKernel()).rejects.toThrow(/unsupported/i);
    } finally {
      globalThis.WebAssembly = original;
    }
  });
});
