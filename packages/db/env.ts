// packages/db/env.ts [АКТУАЛЬНО]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { expand } from "dotenv-expand";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // [EVA_FIX]: Используется ниже

/**
 * [EVA_FIX]: Динамический поиск корня проекта.
 * startDir теперь по умолчанию использует уже вычисленный __dirname.
 */
export const findProjectRoot = (startDir: string = __dirname): string => {
  let currentDir = startDir;
  while (currentDir !== path.parse(currentDir).root) {
    if (fs.existsSync(path.join(currentDir, "pnpm-workspace.yaml"))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  throw new Error("[DB_ENV]: Could not find project root (pnpm-workspace.yaml missing).");
};

const projectRoot = findProjectRoot();
const mode = process.env.NODE_ENV || "development";
const envFile = mode === "production" ? ".env.prod" : ".env";
const envPath = path.resolve(projectRoot, envFile);

const myEnv = dotenv.config({ path: envPath });
expand(myEnv);

export const validateDbUrl = (env: NodeJS.ProcessEnv = process.env): string => {
  const currentMode = env.NODE_ENV || "development";
  const url = currentMode === "test" ? env.TEST_DATABASE_URL : env.DATABASE_URL;
  if (!url) {
    throw new Error(`[DB_ENV]: DATABASE_URL is missing. Mode: ${currentMode}`);
  }
  return url;
};

export const getAdminConfig = (env: NodeJS.ProcessEnv = process.env) => {
  const email = env.ADMIN_EMAIL;
  const password = env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("[DB_ENV]: ADMIN_EMAIL or ADMIN_PASSWORD is missing in .env.");
  }
  return { email, password };
};

export const dbUrl = (process.env.NODE_ENV === "test" ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL) || "";
