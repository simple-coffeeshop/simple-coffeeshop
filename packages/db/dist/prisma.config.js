// packages/db/prisma.config.ts
import { defineConfig } from "prisma/config";
/**
 * [EVAS_PROTIP]: Prisma CLI автоматически загружает .env перед запуском этого файла.
 * Мы используем DATABASE_URL для разработки и можем переключать его для тестов.
 */
export default defineConfig({
    schema: "prisma/schema",
    datasource: {
        // Используем переменную из нашего .env файла
        url: process.env.DATABASE_URL,
    },
});
// Конфиг для клиента (Runtime), который мы создали ранее
export const prismaClientConfig = {
    log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"],
    errorFormat: "pretty",
};
