// packages/db/env.ts [АКТУАЛЬНО]
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { expand } from "dotenv-expand";

/**
 * [EVA_FIX]: Определение путей на уровне модуля.
 * Это предотвращает ошибки в SSR/Vite окружении и ускоряет работу.
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * [EVA_FIX]: Выбор пути к .env в зависимости от режима.
 */
const getEnvPath = (mode: string) => {
  const isDist = __dirname.includes(`${path.sep}dist`);
  const rootOffset = isDist ? "../../../" : "../../";
  const envFile = mode === "production" ? ".env.prod" : ".env";
  return path.resolve(__dirname, rootOffset, envFile);
};

/**
 * [EVA_FIX]: Основная логика разрешения URL.
 * Принимает объект env для изоляции в тестах.
 */
export const resolveDbUrl = (env: NodeJS.ProcessEnv = process.env) => {
  const mode = env.NODE_ENV || "development";

  // Загружаем переменные из файла только если работаем с реальным process.env
  // В тестах мы передаем мок, и этот блок пропускается.
  if (env === process.env) {
    const envPath = getEnvPath(mode);
    const configResult = dotenv.config({ path: envPath });
    if (configResult.parsed) {
      expand(configResult);
    }
  }

  const isTest = mode === "test";
  const url = isTest ? env.TEST_DATABASE_URL : env.DATABASE_URL;

  if (!url) {
    throw new Error(`[DB_ENV]: DATABASE_URL is missing. Mode: ${mode}`);
  }

  return url;
};

/**
 * Основной экспорт для приложения.
 */
export const dbUrl = resolveDbUrl();
