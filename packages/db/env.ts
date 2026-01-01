// packages/db/env.ts

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { expand } from "dotenv-expand";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * [EVA_FIX]: Динамический поиск корня проекта.
 * Ищем pnpm-workspace.yaml вверх по дереву.
 * В Docker-контейнере /app/deployed вернет "/app".
 */
export const findProjectRoot = (startDir: string = __dirname): string => {
  let currentDir = startDir;
  while (currentDir !== path.parse(currentDir).root) {
    if (fs.existsSync(path.join(currentDir, "pnpm-workspace.yaml"))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  return "/app";
};

const projectRoot = findProjectRoot();
const mode = process.env.NODE_ENV || "development";
const envFile = mode === "production" ? ".env.prod" : ".env";
const envPath = path.resolve(projectRoot, envFile);

/**
 * [EVA_FIX]: Загружаем переменные, если файл существует.
 * Если файла нет (Docker Prod), используем переменные, проброшенные в процесс.
 */
if (fs.existsSync(envPath)) {
  const configResult = dotenv.config({ path: envPath });
  if (configResult.parsed) {
    expand(configResult);
  }
}

/**
 * Валидация URL базы данных.
 */
export const validateDbUrl = (env: NodeJS.ProcessEnv = process.env): string => {
  const currentMode = env.NODE_ENV || "development";
  const url = currentMode === "test" ? env.TEST_DATABASE_URL : env.DATABASE_URL;

  if (!url) {
    throw new Error(
      `[DB_ENV]: DATABASE_URL is missing.\n` +
        `Mode: ${currentMode}\n` +
        `Project Root: ${projectRoot}\n` +
        `Tested Path: ${envPath}`,
    );
  }
  return url;
};

/**
 * Валидация и получение данных администратора для скриптов.
 */
export const getAdminConfig = (env: NodeJS.ProcessEnv = process.env) => {
  const email = env.ADMIN_EMAIL;
  const password = env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("[DB_ENV]: ADMIN_EMAIL or ADMIN_PASSWORD is missing in environment.");
  }
  return { email, password };
};

/**
 * Прямой экспорт URL (может быть пустым до валидации в index.ts).
 */
export const dbUrl = (process.env.NODE_ENV === "test" ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL) || "";
