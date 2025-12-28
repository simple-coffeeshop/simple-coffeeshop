// packages/api/src/root.ts
import { authRouter } from "./routers/auth";
import { router } from "./trpc";
export const appRouter = router({
  auth: authRouter,
});
