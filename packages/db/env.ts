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

const envFile = isProd ? ".env.prod" : ".env";
const envPath = path.resolve(__dirname, "../../", envFile);

// 1. Загружаем переменные из файла в process.env
const myEnv = dotenv.config({ path: envPath });

/**
 * [EVA_FIX]: Убираем 'as any'.
 * Передаем результат dotenv.config напрямую в expand.
 * Если файл отсутствует, myEnv.parsed будет undefined, и expand это обработает.
 */
expand(myEnv);

export const dbUrl = isTest ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error(`[DB_ENV]: DATABASE_URL is missing. Mode: ${mode}, Path: ${envPath}`);
}
