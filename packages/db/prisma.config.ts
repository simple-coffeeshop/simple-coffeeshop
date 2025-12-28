// packages/db/prisma.config.ts

import type { Prisma } from "@prisma/client";
import { defineConfig } from "prisma/config";

/**
 * [EVAS_PROTIP]: Мы используем явное приведение к Prisma.LogLevel[],
 * чтобы TypeScript не ругался на несовпадение типов строк.
 */
export default defineConfig({
  schema: "prisma/schema",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});

export const prismaConfig = {
  log: (process.env.NODE_ENV === "development"
    ? ["query", "info", "warn", "error"]
    : ["error"]) as Prisma.LogLevel[],
  errorFormat: "pretty",
} as const;
