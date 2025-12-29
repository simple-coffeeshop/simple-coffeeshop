// packages/api/src/root.ts
import { authRouter } from "./routers/auth";
import { router } from "./trpc";
/**
 * [EVAS_SYNC]: Корневой роутер приложения.
 * Все бизнес-роутеры должны подключаться сюда.
 */
export const appRouter = router({
    auth: authRouter,
});
