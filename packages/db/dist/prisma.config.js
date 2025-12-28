// packages/db/prisma.config.ts
import path from "node:path";
import dotenv from "dotenv";
import { expand } from "dotenv-expand";
import { defineConfig } from "prisma/config";
/**
 * [EVAS_PROTIP]: Мы загружаем переменные и сразу "расширяем" их.
 * Теперь process.env.DATABASE_URL будет содержать реальный пароль и хост,
 * а не текст "${POSTGRES_USER}".
 */
const myEnv = dotenv.config({ path: path.resolve(__dirname, "../../.env") });
expand(myEnv);
const isTest = process.env.NODE_ENV === "test";
const dbUrl = isTest ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL;
if (!dbUrl) {
    throw new Error(`[PRISMA_CONFIG]: DATABASE_URL is undefined for NODE_ENV=${process.env.NODE_ENV}`);
}
export default defineConfig({
    schema: "prisma/schema",
    datasource: {
        url: dbUrl,
    },
});
export const prismaConfig = {
    log: (process.env.NODE_ENV === "development"
        ? ["query", "info", "warn", "error"]
        : ["error"]),
    errorFormat: "pretty",
};
