// packages/db/prisma.config.ts

import type { Prisma } from "@prisma/client";
import { defineConfig } from "prisma/config";

/**
 * [EVAS_PROTIP]: Мы проверяем NODE_ENV. Если это 'test',
 * приоритет отдается TEST_DATABASE_URL.
 */
const dbUrl =
  process.env.NODE_ENV === "test"
    ? (process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/test_db")
    : (process.env.DATABASE_URL ?? "postgresql://forbidden");

export default defineConfig({
  schema: "prisma/schema",
  datasource: {
    url: dbUrl,
  },
});

export const prismaConfig: Prisma.PrismaClientOptions = {
  log: (process.env.NODE_ENV === "development"
    ? ["query", "info", "warn", "error"]
    : ["error"]) as Prisma.LogLevel[],
  errorFormat: "pretty",
};
