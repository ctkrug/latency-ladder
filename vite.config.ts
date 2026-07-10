import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  assetsInclude: ["**/*.wasm"],
  build: {
    outDir: "dist",
    assetsDir: "assets",
  },
  server: {
    port: 5173,
  },
});
