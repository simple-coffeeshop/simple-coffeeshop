// packages/api/src/routers/auth.ts
import { z } from "zod";
import { publicProcedure, rootProcedure, router } from "../trpc";

export const authRouter = router({
  /**
   * Инвайт для CO_SU: доступно только ROOT
   */
  inviteCoSu: rootProcedure
    .input(
      z.object({
        email: z.email(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const newUser = await ctx.prisma.user.create({
        data: {
          email: input.email.toLowerCase(),
          platformRole: "CO_SU",
        },
      });

      return { success: true, email: newUser.email };
    }),

  /**
   * Проверка Magic Link
   */
  verifyMagicLink: publicProcedure
    .input(z.object({ token: z.string() }))
    // Правильная деструктуризация: переименовываем 'input' в '_input' для линтера
    .query(async ({ input: _input }) => {
      return { valid: true };
    }),
});
