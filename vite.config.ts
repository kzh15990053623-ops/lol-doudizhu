import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    target: "baseline-widely-available",
    cssCodeSplit: true,
    sourcemap: false,
  },
  test: {
    environment: "node",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: true,
    restoreMocks: true,
    testTimeout: 10_000,
  },
});
