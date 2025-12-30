// packages/api/src/root.ts
import { authRouter } from "./routers/auth";
import { networkRouter } from "./routers/network"; //
import { router } from "./trpc";

/**
 * [EVAS_SYNC]: Корневой роутер приложения.
 * Теперь включает все базовые модули Спринта №1.
 */
export const appRouter = router({
  auth: authRouter,
  network: networkRouter, //
});

export type AppRouter = typeof appRouter;
