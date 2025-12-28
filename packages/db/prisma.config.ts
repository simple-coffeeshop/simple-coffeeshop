// packages/db/prisma.config.ts

import type { Prisma } from "@prisma/client";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});

/**
 * [EVAS_PROTIP]: Мы используем явное приведение к Prisma.LogLevel[],
 * чтобы избежать ошибки TS2345 при создании PrismaClient.
 */
export const prismaConfig: Prisma.PrismaClientOptions = {
  log: (process.env.NODE_ENV === "development"
    ? ["query", "info", "warn", "error"]
    : ["error"]) as Prisma.LogLevel[],
  errorFormat: "pretty",
};
