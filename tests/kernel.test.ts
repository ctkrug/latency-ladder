import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Exercises the real compiled kernel.wasm (not a mock) to catch bugs in the
// actual pointer-chase logic that a mocked-kernel unit test can't see, e.g.
// a shuffle that fragments into multiple disjoint cycles instead of one.
interface KernelExports {
  memory: WebAssembly.Memory;
  chase(bufPtr: number, size: number, steps: number): number;
  buildRing(bufPtr: number, size: number, seed: number): void;
  alloc(size: number): number;
  dealloc(ptr: number): void;
}

async function loadRealKernel(): Promise<KernelExports> {
  const wasmPath = path.resolve(__dirname, "../src/wasm/kernel.wasm");
  const bytes = readFileSync(wasmPath);
  const imports = {
    env: {
      abort(_msgPtr: number, _filePtr: number, line: number, column: number): never {
        throw new Error(`wasm kernel aborted at ${line}:${column}`);
      },
    },
  };
  const { instance } = await WebAssembly.instantiate(bytes, imports);
  return instance.exports as unknown as KernelExports;
}

/** Reads the ring back out of wasm memory as a plain array for inspection. */
function readRing(kernel: KernelExports, ptr: number, size: number): number[] {
  const view = new Int32Array(kernel.memory.buffer, ptr, size);
  return Array.from(view);
}

function cycleLengthFrom(ring: number[], start: number): number {
  const seen = new Set<number>();
  let idx = start;
  while (!seen.has(idx)) {
    seen.add(idx);
    idx = ring[idx]!;
  }
  return seen.size;
}

describe("kernel.wasm buildRing", () => {
  it("produces a single cycle touching every slot, not fragmented sub-cycles", async () => {
    const kernel = await loadRealKernel();
    const size = 4_096;
    const ptr = kernel.alloc(size);
    try {
      kernel.buildRing(ptr, size, 0x2545f491);
      const ring = readRing(kernel, ptr, size);
      expect(cycleLengthFrom(ring, 0)).toBe(size);
    } finally {
      kernel.dealloc(ptr);
    }
  });

  it("produces a full cycle across a range of seeds and sizes", async () => {
    const kernel = await loadRealKernel();
    for (const size of [2, 3, 100, 5_000]) {
      for (const seed of [1, 42, -12345, 0x2545f491]) {
        const ptr = kernel.alloc(size);
        try {
          kernel.buildRing(ptr, size, seed);
          const ring = readRing(kernel, ptr, size);
          expect(cycleLengthFrom(ring, 0)).toBe(size);
        } finally {
          kernel.dealloc(ptr);
        }
      }
    }
  });

  it("treats a seed of 0 the same as a non-zero fallback seed (no degenerate all-zero state)", async () => {
    const kernel = await loadRealKernel();
    const size = 256;
    const ptr = kernel.alloc(size);
    try {
      kernel.buildRing(ptr, size, 0);
      const ring = readRing(kernel, ptr, size);
      expect(cycleLengthFrom(ring, 0)).toBe(size);
    } finally {
      kernel.dealloc(ptr);
    }
  });
});

describe("kernel.wasm chase", () => {
  it("returns an in-range index after walking the full ring multiple times", async () => {
    const kernel = await loadRealKernel();
    const size = 1_024;
    const ptr = kernel.alloc(size);
    try {
      kernel.buildRing(ptr, size, 0x2545f491);
      const result = kernel.chase(ptr, size, size * 3);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(size);
    } finally {
      kernel.dealloc(ptr);
    }
  });

  it("returns the starting index (0) after exactly `size` steps on a full cycle", async () => {
    const kernel = await loadRealKernel();
    const size = 512;
    const ptr = kernel.alloc(size);
    try {
      kernel.buildRing(ptr, size, 7);
      // A full single cycle of length `size` returns to the start after
      // exactly `size` hops from index 0.
      expect(kernel.chase(ptr, size, size)).toBe(0);
    } finally {
      kernel.dealloc(ptr);
    }
  });
});
