import { afterEach, describe, expect, it, vi } from "vitest";
import { benchmarkNetwork } from "../src/benchmarks/network";

describe("benchmarkNetwork", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requests a unique URL per trial with cache disabled", async () => {
    const urls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        urls.push(String(input));
        expect(init?.cache).toBe("no-store");
        return Promise.resolve(new Response(null, { status: 200 }));
      }),
    );

    await benchmarkNetwork();

    expect(urls.length).toBeGreaterThan(0);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("rejects when fetch rejects instead of reporting Infinity/NaN", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("network offline"))),
    );

    await expect(benchmarkNetwork()).rejects.toThrow("network offline");
  });
});
