// packages/api/src/routers/business.ts
import { z } from "zod";
import { protectedProcedure, router } from "../trpc.js";

export const businessRouter = router({
  /**
   * Получение списка всех бизнесов.
   */
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const isPlatformAdmin = ctx.platformRole === "ROOT" || ctx.platformRole === "CO_SU";

    return await ctx.prisma.business.findMany({
      where: {
        id: isPlatformAdmin ? undefined : ctx.businessId,
        isArchived: false,
      },
      include: {
        owner: {
          select: {
            email: true,
            employeeProfile: { select: { firstName: true, lastName: true } },
          },
        },
        _count: { select: { units: true } },
      },
    });
  }),

  /**
   * Инвайт владельца (Task 2).
   * Реализует Invite-driven Ownership Flow.
   */
  inviteOwner: protectedProcedure
    .input(
      z.object({
        businessId: z.string(),
        email: z.email(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const token = Math.random().toString(36).substring(2, 15);

      const invite = await ctx.prisma.invite.create({
        data: {
          email: input.email.toLowerCase(),
          token,
          role: "CO_SU",
          businessId: input.businessId,
          expiresAt: new Date(Date.now() + 168 * 60 * 60 * 1000), // 7 дней
          invitedById: ctx.userId,
        },
      });

      // Используем invite для логирования, чтобы устранить предупреждение об использовании
      console.info(`[Sprint 1] Invite generated: ${invite.token} for business: ${input.businessId}`);

      // Используем newOwnerEmail (String), так как юзера может еще не быть в системе
      return await ctx.prisma.handshake.create({
        data: {
          businessId: input.businessId,
          formerOwnerId: ctx.userId,
          newOwnerEmail: input.email.toLowerCase(),
          status: "PENDING",
          effectiveAt: new Date(Date.now() + 168 * 60 * 60 * 1000),
        },
      });
    }),
});
