// packages/api/src/root.ts
import { authRouter } from "./routers/auth.js";
import { businessRouter } from "./routers/business.js";
import { networkRouter } from "./routers/network.js";
import { router } from "./trpc.js";

/**
 * [EVAS_SYNC]: Корневой роутер приложения.
 * Возвращаемся к стандартной плоской структуре.
 */
export const appRouter = router({
  auth: authRouter,
  network: networkRouter,
  business: businessRouter, // Вот этого подключения не хватало!
});

export type AppRouter = typeof appRouter;
