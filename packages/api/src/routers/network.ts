// packages/api/src/routers/network.ts
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../trpc";

export const networkRouter = router({
  /**
   * Список подразделений текущего бизнеса
   */
  listUnits: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.unit.findMany({
      where: { isArchived: false },
      include: { enterprise: true },
      orderBy: { name: "asc" },
    });
  }),

  /**
   * Создание нового подразделения
   */
  createUnit: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2),
        enterpriseId: z.string(),
        timezone: z.string().default("UTC"), // [POLICY]: UTC Everywhere
        capabilities: z.array(z.enum(["DATA", "KITCHEN", "STAFF", "SUPPLIER", "CASH", "CERTIFICATION"])),
        address: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // [FIX]: Явная проверка businessId вместо "!" для Biome
      if (!ctx.businessId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Необходимо выбрать бизнес для создания подразделения",
        });
      }

      return ctx.db.unit.create({
        data: {
          ...input,
          businessId: ctx.businessId,
        },
      });
    }),

  /**
   * Передача прав владельца (Handshake)
   */
  initiateOwnershipTransfer: protectedProcedure
    .input(z.object({ newOwnerId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { businessId, userId, platformRole } = ctx;

      if (!businessId || !userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Недостаточно данных для инициации передачи прав",
        });
      }

      const business = await ctx.prisma.business.findUnique({
        where: { id: businessId },
      });

      // Только текущий владелец или ROOT могут запустить процесс
      if (business?.ownerId !== userId && platformRole !== "ROOT") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Только владелец может передать права",
        });
      }

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 168); // Кулдаун 168 часов

      return ctx.db.handshake.create({
        data: {
          businessId: businessId,
          formerOwnerId: userId,
          newOwnerId: input.newOwnerId,
          expiresAt,
          status: "PENDING",
        },
      });
    }),

  /**
   * Глобальный список всех бизнесов (Только для платформенных админов)
   */
  listAllBusinesses: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.business.findMany({
      where: { isArchived: false },
      include: { _count: { select: { units: true, members: true } } },
    });
  }),
});
