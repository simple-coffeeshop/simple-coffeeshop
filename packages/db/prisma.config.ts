// packages/db/prisma.config.ts
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});

// Переименовываем экспорт, чтобы src/index.ts его увидел
export const prismaConfig = {
  log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"],
  errorFormat: "pretty",
} as const;
