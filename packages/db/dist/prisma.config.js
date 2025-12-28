// packages/db/prisma.config.ts
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
        : ["error"]),
    errorFormat: "pretty",
};
