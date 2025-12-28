// packages/api/src/routers/auth.ts
import { z } from "zod";
import { publicProcedure, router } from "../trpc";

export const authRouter = router({
  requestMagicLink: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      // Пока просто логируем для Спринта №1
      console.log(`[MAGIC LINK] Запрос для: ${input.email}`);
      return { success: true };
    }),

  verify: publicProcedure.input(z.object({ token: z.string() })).mutation(async () => {
    return { token: "session_jwt_mock" };
  }),
});
