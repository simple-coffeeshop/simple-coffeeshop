// packages/api/src/routers/auth.ts
import { publicProcedure, router } from "../trpc";
import { RequestMagicLinkSchema, VerifyTokenSchema } from "../validators/auth.schema";

export const authRouter = router({
  requestMagicLink: publicProcedure.input(RequestMagicLinkSchema).mutation(async ({ input, ctx }) => {
    const user = await ctx.prisma.user.findFirst({
      where: { email: input.email },
    });

    if (!user) {
      ctx.logger.warn({ email: input.email }, "Magic link requested for unknown email");
      return { success: true }; // Защита от перебора
    }

    // TODO: Интеграция с сервисом отправки почты
    ctx.logger.info({ userId: user.id }, "Magic link generated");

    return { success: true };
  }),

  verify: publicProcedure.input(VerifyTokenSchema).mutation(async () => {
    return { token: "mock_jwt", businessId: "mock_biz" };
  }),
});
