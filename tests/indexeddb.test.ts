import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { benchmarkIndexedDb } from "../src/benchmarks/indexeddb";

describe("benchmarkIndexedDb", () => {
  beforeEach(() => {
    // fake-indexeddb persists databases across tests in the same module
    // instance; each test wants a clean scratch store.
    indexedDB.deleteDatabase("latency-ladder-scratch");
  });

  it("resolves a positive nanosecond latency", async () => {
    const ns = await benchmarkIndexedDb();
    expect(ns).toBeGreaterThan(0);
    expect(Number.isFinite(ns)).toBe(true);
  });

  it("reuses the existing object store on a second run without erroring", async () => {
    await expect(benchmarkIndexedDb()).resolves.toBeGreaterThan(0);
    await expect(benchmarkIndexedDb()).resolves.toBeGreaterThan(0);
  });

  it("rejects with a clear message when indexedDB is unavailable", async () => {
    const original = globalThis.indexedDB;
    // @ts-expect-error simulating a browser without IndexedDB support
    delete globalThis.indexedDB;

    try {
      await expect(benchmarkIndexedDb()).rejects.toThrow(/unsupported/i);
    } finally {
      globalThis.indexedDB = original;
    }
  });
});
