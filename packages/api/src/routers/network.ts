// packages/api/src/routers/network.ts
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc.js";

/**
 * Роутер управления сетевой структурой.
 * Реализует логику Паспорта Юнита и передачи прав владения.
 */
export const networkRouter = router({
  /**
   * Список всех подразделений (Юнитов) текущего бизнеса.
   */
  listUnits: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.unit.findMany({
      where: { isArchived: false },
      include: {
        enterprise: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    });
  }),

  /**
   * Список предприятий (Enterprises) текущего бизнеса.
   */
  listEnterprises: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.enterprise.findMany({
      where: { isArchived: false },
      select: { id: true, name: true },
    });
  }),

  /**
   * Создание нового Юнита.
   * Обязательно проверяет Capabilities и применяет Geofencing.
   */
  createUnit: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2),
        enterpriseId: z.string(),
        timezone: z.string().default("UTC"),
        capabilities: z.array(z.enum(["INVENTORY", "PRODUCTION", "STAFF", "FINANCE", "LOGISTICS", "LMS"])),
        address: z.string().optional(),
        allowedIps: z.array(z.string()).default([]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.db.unit.create({
        data: {
          ...input,
          businessId: ctx.businessId,
        },
      });
    }),

  /**
   * Инициация передачи владения (Ownership Transfer).
   * [BEST PRACTICE]: Используем Email для связи с будущим владельцем.
   */
  initiateOwnershipTransfer: protectedProcedure
    .input(z.object({ newOwnerEmail: z.email() }))
    .mutation(async ({ input, ctx }) => {
      const business = await ctx.prisma.business.findUnique({
        where: { id: ctx.businessId },
      });

      // Проверка прав: только текущий владелец или ROOT
      if (business?.ownerId !== ctx.userId && ctx.platformRole !== "ROOT") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Недостаточно прав для инициации передачи бизнеса",
        });
      }

      // Кулдаун 168 часов (Sprint 1 Blueprint)
      const effectiveAt = new Date();
      effectiveAt.setHours(effectiveAt.getHours() + 168);

      return ctx.prisma.handshake.create({
        data: {
          businessId: ctx.businessId,
          formerOwnerId: ctx.userId,
          newOwnerEmail: input.newOwnerEmail,
          status: "PENDING",
          effectiveAt,
        },
      });
    }),
});
