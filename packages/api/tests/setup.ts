// packages/api/tests/setup.ts
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { expand } from "dotenv-expand";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Загружаем и РАСШИРЯЕМ переменные
const env = config({ path: path.resolve(__dirname, "../../../.env") });
expand(env);

// 2. Подменяем базу на тестовую
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
} else {
  console.warn("⚠️ TEST_DATABASE_URL not found in environment");
}
