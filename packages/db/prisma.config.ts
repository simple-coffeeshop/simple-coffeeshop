// packages/db/prisma.config.ts
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Prisma } from "@prisma/client";
import dotenv from "dotenv";
import { expand } from "dotenv-expand";
import { defineConfig } from "prisma/config";

// Эмуляция __dirname в ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * [EVA_STRATEGY]: Выбираем файл окружения.
 * По умолчанию ищем .env (для dev/test), в продакшене — .env.prod.
 */
const envFile = process.env.NODE_ENV === "production" ? ".env.prod" : ".env";
const envPath = path.resolve(__dirname, "../../", envFile);

// Загружаем и раскрываем переменные (${VAR})
const myEnv = dotenv.config({ path: envPath });
expand(myEnv);

const isTest = process.env.NODE_ENV === "test";

// Экспортируем строку подключения
export const dbUrl = isTest ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error(
    `[PRISMA_CONFIG]: DATABASE_URL is undefined. 
     NODE_ENV: ${process.env.NODE_ENV}, 
     Target File: ${envFile}`,
  );
}

// Конфигурация Prisma
export default defineConfig({
  schema: "prisma/schema",
  datasource: {
    url: dbUrl,
  },
});

// Опции логов для PrismaClient
export const prismaConfig: Prisma.PrismaClientOptions = {
  log: (process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"]) as Prisma.LogLevel[],
  errorFormat: "pretty",
};
