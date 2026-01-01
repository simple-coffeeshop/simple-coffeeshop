// packages/db/env.ts
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { expand } from "dotenv-expand";

// Эмуляция __dirname в ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProd = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";

/**
 * [EVA_STRATEGY]: Загрузка переменных окружения.
 * Мы поднимаемся на 2 уровня вверх из packages/db/dist/ (или src/) до корня монорепозитория.
 */
const envFile = isProd ? ".env.prod" : ".env";
const envPath = path.resolve(__dirname, "../../", envFile);

const myEnv = dotenv.config({ path: envPath });
expand(myEnv);

export const dbUrl = isTest ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error(
    `[DB_ENV]: DATABASE_URL is missing. 
     NODE_ENV: ${process.env.NODE_ENV}, 
     Target File: ${envPath}`,
  );
}
