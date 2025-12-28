// packages/db/vitest.config.ts

import path from "node:path";
import dotenv from "dotenv";
import { expand } from "dotenv-expand";
import { defineConfig } from "vitest/config";

/**
 * [EVAS_PROTIP]: Мы загружаем и расширяем переменные из корня,
 * чтобы тесты точно знали, где находится TEST_DATABASE_URL.
 */
const myEnv = dotenv.config({ path: path.resolve(__dirname, "../../.env") });
expand(myEnv);

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Увеличиваем таймаут для работы с реальной БД
    testTimeout: 10000,
  },
});
