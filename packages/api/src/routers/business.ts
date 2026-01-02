// packages/api/src/routers/business.ts
import { TRPCError } from "@trpc/server";
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
          role: "NONE", // Обычный юзер до принятия прав
          businessId: input.businessId,
          expiresAt: new Date(Date.now() + 168 * 60 * 60 * 1000), // 7 дней
          invitedById: ctx.userId,
        },
      });

      console.info(`[Sprint 1] Invite generated: ${invite.token} for business: ${input.businessId}`);

      return await ctx.prisma.handshake.create({
        data: {
          businessId: input.businessId,
          formerOwnerId: ctx.userId,
          newOwnerEmail: input.email.toLowerCase(),
          status: "PENDING",
          effectiveAt: new Date(Date.now() + 168 * 60 * 60 * 1000), // Кулдаун 168 часов
        },
      });
    }),

  /**
   * Принятие прав владения после истечения кулдауна.
   */
  acceptOwnership: protectedProcedure.input(z.object({ handshakeId: z.string() })).mutation(async ({ input, ctx }) => {
    const handshake = await ctx.prisma.handshake.findUnique({
      where: { id: input.handshakeId },
    });

    if (!handshake || handshake.status !== "PENDING") {
      throw new TRPCError({ code: "NOT_FOUND", message: "Активный запрос на передачу прав не найден" });
    }

    // Проверка кулдауна (168 часов)
    if (handshake.effectiveAt > new Date()) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Cooldown period is active (период ожидания 168ч)",
      });
    }

    // Атомарное обновление владельца и статуса хэндшейка
    return await ctx.prisma.$transaction([
      ctx.prisma.business.update({
        where: { id: handshake.businessId },
        data: { ownerId: ctx.userId },
      }),
      ctx.prisma.handshake.update({
        where: { id: handshake.id },
        data: { status: "COMPLETED" },
      }),
    ]);
  }),

  /**
   * Мгновенная отмена передачи прав владельцем или ROOT.
   */
  revokeOwnershipTransfer: protectedProcedure
    .input(z.object({ handshakeId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const handshake = await ctx.prisma.handshake.findUnique({
        where: { id: input.handshakeId },
      });

      if (!handshake) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Запрос не найден" });
      }

      // Отменить может только инициатор (formerOwner) или администратор платформы
      if (handshake.formerOwnerId !== ctx.userId && ctx.platformRole !== "ROOT") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Недостаточно прав для отмены" });
      }

      return await ctx.prisma.handshake.update({
        where: { id: handshake.id },
        data: { status: "REVOKED" },
      });
    }),
});
