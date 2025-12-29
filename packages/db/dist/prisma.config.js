// packages/db/prisma.config.ts
import path from "node:path";
import dotenv from "dotenv";
import { expand } from "dotenv-expand";
import { defineConfig } from "prisma/config";
const myEnv = dotenv.config({ path: path.resolve(__dirname, "../../.env") });
expand(myEnv);
const isTest = process.env.NODE_ENV === "test";
// Экспортируем строку подключения отдельно
export const dbUrl = isTest ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL;
if (!dbUrl) {
    throw new Error(`[PRISMA_CONFIG]: DATABASE_URL is undefined for NODE_ENV=${process.env.NODE_ENV}`);
}
export default defineConfig({
    schema: "prisma/schema",
    datasource: {
        url: dbUrl,
    },
});
// Здесь оставляем только стандартные опции логов
export const prismaConfig = {
    log: (process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"]),
    errorFormat: "pretty",
};
