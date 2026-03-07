import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    pool: "vmThreads",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"]
  }
});
