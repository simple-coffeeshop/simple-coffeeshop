// packages/api/vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./tests/setup.ts"],
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
