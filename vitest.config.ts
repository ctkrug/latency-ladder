import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      // kernel.js/kernel.d.ts are generated AssemblyScript bindings that
      // loader.ts doesn't import (it fetches kernel.wasm directly) - they're
      // gitignored build output, not source to cover.
      exclude: ["src/wasm/kernel.js", "src/wasm/kernel.d.ts"],
    },
  },
});
