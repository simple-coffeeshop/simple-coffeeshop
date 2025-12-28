import type { Prisma } from "@prisma/client";
import { defineConfig } from "prisma/config";

/**
 * [EVAS_PROTIP]: В Prisma 7 для устранения TS2345 мы уходим от 'as const'.
 * Мы явно типизируем объект как Prisma.PrismaClientOptions.
 */
export default defineConfig({
  schema: "prisma/schema",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});

export const prismaConfig: Prisma.PrismaClientOptions = {
  log: (process.env.NODE_ENV === "development"
    ? ["query", "info", "warn", "error"]
    : ["error"]) as Prisma.LogLevel[],
  errorFormat: "pretty",
};
