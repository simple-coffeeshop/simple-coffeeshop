// packages/db/env.ts
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { expand } from "dotenv-expand";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mode = process.env.NODE_ENV || "development";
const isProd = mode === "production";
const isTest = mode === "test";

/**
 * [EVA_FIX]: В скомпилированном виде файл лежит в packages/db/dist/env.js.
 * Чтобы попасть в корень проекта из dist, нужно подняться на 3 уровня.
 */
const envFile = isProd ? ".env.prod" : ".env";
const envPath = path.resolve(__dirname, "../../../", envFile);

// Загружаем переменные из файла
const myEnv = dotenv.config({ path: envPath });

/**
 * [EVA_FIX]: Убираем 'as any'.
 * expand() может принимать результат dotenv.config() напрямую.
 */
expand(myEnv);

export const dbUrl = isTest ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error(`[DB_ENV]: DATABASE_URL is missing. Mode: ${mode}, Path: ${envPath}`);
}
