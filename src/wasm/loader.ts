// Thin wrapper around the compiled AssemblyScript kernel. Kept separate from
// the benchmark modules so cache.ts and ram.ts share one instantiation.

interface KernelExports {
  memory: WebAssembly.Memory;
  chase(bufPtr: number, size: number, steps: number): number;
  buildRing(bufPtr: number, size: number, seed: number): void;
  alloc(size: number): number;
  dealloc(ptr: number): void;
}

let kernelPromise: Promise<KernelExports> | null = null;

const imports = {
  env: {
    // AssemblyScript's runtime traps (e.g. an out-of-bounds store) call this;
    // a benchmark kernel should never hit it, so surface it loudly.
    abort(msgPtr: number, filePtr: number, line: number, column: number): never {
      throw new Error(`wasm kernel aborted at ${line}:${column}`);
    },
  },
};

export async function loadKernel(): Promise<KernelExports> {
  if (typeof WebAssembly === "undefined") {
    throw new Error("WebAssembly unsupported in this browser");
  }

  if (!kernelPromise) {
    kernelPromise = fetch(new URL("./kernel.wasm", import.meta.url))
      .then((res) => res.arrayBuffer())
      .then((bytes) => WebAssembly.instantiate(bytes, imports))
      .then((result) => result.instance.exports as unknown as KernelExports);
  }
  return kernelPromise;
}

export type { KernelExports };
