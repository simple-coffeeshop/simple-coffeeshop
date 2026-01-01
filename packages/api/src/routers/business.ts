// packages/api/src/routers/business.ts
import { z } from "zod";
import { protectedProcedure, router, TRPCError } from "../trpc.js";

export const businessRouter = router({
  /**
   * Получение списка всех бизнесов.
   * SU видит всё, OWNER — только свои.
   */
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const isPlatformAdmin = ctx.platformRole === "ROOT" || ctx.platformRole === "CO_SU";

    return await ctx.prisma.business.findMany({
      where: {
        id: isPlatformAdmin ? undefined : (ctx.businessId ?? "none"),
        isArchived: false,
      },
      include: {
        owner: { select: { email: true, firstName: true, lastName: true } },
        _count: { select: { units: true } },
      },
    });
  }),

  /**
   * Создание нового бизнеса (только для админов платформы)
   */
  create: protectedProcedure.input(z.object({ name: z.string().min(3) })).mutation(async ({ input, ctx }) => {
    // [FIX]: Используем platformRole напрямую из контекста
    if (ctx.platformRole === "NONE") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only platform admins can create businesses",
      });
    }

    return await ctx.prisma.business.create({
      data: { name: input.name },
    });
  }),

  /**
   * Инвайт владельца в бизнес
   */
  inviteOwner: protectedProcedure
    .input(
      z.object({
        businessId: z.string(),
        email: z.email(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // 1. Находим или создаем пользователя для инвайта
      const targetUser = await ctx.prisma.user.upsert({
        where: { email: input.email.toLowerCase() },
        update: {},
        create: { email: input.email.toLowerCase() },
      });

      // 2. Создаем Handshake (процесс передачи владения)
      return await ctx.prisma.handshake.create({
        data: {
          businessId: input.businessId,
          formerOwnerId: ctx.userId, // Инициатор (SU)
          newOwnerId: targetUser.id,
          expiresAt: new Date(Date.now() + 168 * 60 * 60 * 1000), // 168 часов
        },
      });
    }),
});
