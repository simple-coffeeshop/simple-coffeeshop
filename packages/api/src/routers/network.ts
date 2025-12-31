// packages/api/src/routers/network.ts

import { HandshakeStatus } from "@simple-coffeeshop/db"; // [FIX]: Убрали Capability
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
        timezone: z.string().default("UTC"),
        capabilities: z.array(z.enum(["DATA", "KITCHEN", "STAFF", "SUPPLIER", "CASH", "CERTIFICATION"])),
        address: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
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
      const { businessId, userId, platformRole, prisma, db } = ctx;

      if (!businessId || !userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Недостаточно данных для инициации передачи прав",
        });
      }

      const business = await prisma.business.findUnique({
        where: { id: businessId },
      });

      if (business?.ownerId !== userId && platformRole !== "ROOT") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Только владелец может передать права",
        });
      }

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 168);

      return db.handshake.create({
        data: {
          businessId,
          formerOwnerId: userId,
          newOwnerId: input.newOwnerId,
          expiresAt,
          status: HandshakeStatus.PENDING,
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
