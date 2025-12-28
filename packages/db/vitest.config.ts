// packages/db/vitest.config.ts

import path from "node:path";
import dotenv from "dotenv";
import { defineConfig } from "vitest/config";

// Загружаем переменные из корня монорепозитория
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    // Скрипт очистки БД перед каждым тестом (опционально)
    // setupFiles: ["./tests/setup.ts"],
  },
});
