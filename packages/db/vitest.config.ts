// packages/db/vitest.config.ts

import path from "node:path";
import dotenv from "dotenv";
import { expand } from "dotenv-expand";
import { defineConfig } from "vitest/config";

const myEnv = dotenv.config({ path: path.resolve(__dirname, "../../.env") });
expand(myEnv);

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 10000,
    poolOptions: {
      threads: false,
    },
    restoreMocks: true,
    mockReset: true,
    reporters: ["default"],
  },
});
