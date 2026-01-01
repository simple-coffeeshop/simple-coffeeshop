// packages/db/prisma.config.ts
import { defineConfig } from "prisma/config";
import { dbUrl } from "./env.js";

/**
 * [EVA_FIX]: Этот файл теперь импортирует только чистый dbUrl.
 * Пакет 'prisma' остается в devDependencies и не ломает продакшен.
 */
export default defineConfig({
  schema: "prisma/schema",
  datasource: {
    url: dbUrl,
  },
});
