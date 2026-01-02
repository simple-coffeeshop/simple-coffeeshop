// packages/api/src/routers/network.ts [АКТУАЛЬНО]
import { HandshakeStatus } from "@simple-coffeeshop/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../trpc.js";

/**
 * [EVA_LOGIC]: Роутер Network отвечает за Модуль 00: Core Network & Identity.
 * Управляет иерархией: Business -> Enterprise -> Unit.
 */
export const networkRouter = router({
  // --- Enterprises (Сети) ---
  listEnterprises: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.enterprise.findMany({
      where: {
        businessId: ctx.businessId ?? "none",
        isArchived: false,
      },
      include: { _count: { select: { units: true } } },
      orderBy: { name: "asc" },
    });
  }),

  createEnterprise: protectedProcedure.input(z.object({ name: z.string().min(2) })).mutation(async ({ input, ctx }) => {
    if (!ctx.businessId) throw new TRPCError({ code: "BAD_REQUEST", message: "Бизнес не выбран" });

    return ctx.db.enterprise.create({
      data: {
        name: input.name,
        businessId: ctx.businessId,
      },
    });
  }),

  // --- Units (Торговые точки) ---
  listUnits: protectedProcedure.query(async ({ ctx }) => {
    const isPlatformAdmin = ctx.platformRole === "ROOT" || ctx.platformRole === "CO_SU";

    return ctx.db.unit.findMany({
      where: {
        // [EVA_FIX]: ROOT видит всё (undefined), остальные — только свой бизнес
        businessId: isPlatformAdmin ? (ctx.businessId ?? undefined) : (ctx.businessId ?? "none"),
        isArchived: false,
      },
      include: { enterprise: true },
      orderBy: { name: "asc" },
    });
  }),

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

      // Проверяем принадлежность сети к бизнесу
      const ent = await ctx.db.enterprise.findFirst({
        where: { id: input.enterpriseId, businessId: ctx.businessId },
      });
      if (!ent) throw new TRPCError({ code: "FORBIDDEN", message: "Сеть не найдена в текущем бизнесе" });

      return ctx.db.unit.create({
        data: {
          ...input,
          businessId: ctx.businessId,
        },
      });
    }),

  // --- Ownership ---
  initiateOwnershipTransfer: protectedProcedure
    .input(z.object({ newOwnerId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { businessId, userId, platformRole, db } = ctx;

      if (!businessId || !userId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Недостаточно данных" });
      }

      const business = await ctx.prisma.business.findUnique({
        where: { id: businessId },
      });

      if (business?.ownerId !== userId && platformRole !== "ROOT") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Только владелец может передать права" });
      }

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 168); // 168 часов согласно 00_module.md

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

  listAllBusinesses: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.business.findMany({
      where: { isArchived: false },
      include: { _count: { select: { units: true, members: true } } },
    });
  }),
});
