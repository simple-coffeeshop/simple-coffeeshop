// packages/db/vitest.config.ts

import path from "node:path";
import dotenv from "dotenv";
import { defineConfig } from "vitest/config";

// Гарантируем загрузку переменных перед инициализацией тестов
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
