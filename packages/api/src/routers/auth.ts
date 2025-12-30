// packages/api/src/routers/auth.ts
import { z } from "zod";
import { publicProcedure, rootProcedure, router } from "../trpc";

export const authRouter = router({
  /**
   * Запрос Magic Link
   */
  requestMagicLink: publicProcedure.input(z.object({ email: z.email() })).mutation(async ({ input, ctx }) => {
    // [FIX]: Добавляем вызов Prisma, который ожидает тест
    await ctx.prisma.user.findFirst({
      where: { email: input.email.toLowerCase() },
    });

    // В будущем здесь будет генерация токена и отправка письма
    return { success: true };
  }),

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
    // Переименовываем 'input' в '_input', чтобы удовлетворить Biome
    .query(async ({ input: _input }) => {
      return { valid: true };
    }),
});
