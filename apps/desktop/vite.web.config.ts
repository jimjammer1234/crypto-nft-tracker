// Standalone (non-Electron) build of the same renderer, served as a static site directly from the
// backend so the dashboard is reachable from a phone/any browser. Deliberately built WITHOUT
// VITE_API_BASE_URL/VITE_API_TOKEN — see src/renderer/src/lib/auth.ts for why the token isn't
// baked into this public bundle.
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: resolve(__dirname, "src/renderer"),
  base: "./",
  css: {
    postcss: resolve(__dirname),
  },
  resolve: {
    alias: {
      "@renderer": resolve(__dirname, "src/renderer/src"),
    },
  },
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, "dist-web"),
    emptyOutDir: true,
  },
});
