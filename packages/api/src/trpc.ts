// packages/api/src/trpc.ts

import type { PlatformRole } from "@simple-coffeeshop/db"; // [EVA_FIX]: Импорт строго как тип
import { createIsolatedClient, prisma } from "@simple-coffeeshop/db";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

/**
 * [EVA_FIX]: Внутренний контекст для тестов.
 */
export const createInnerTRPCContext = (opts: {
  userId?: string | null;
  businessId?: string | null;
  platformRole?: PlatformRole;
  is2FAVerified?: boolean;
}) => {
  const { businessId, platformRole, userId, is2FAVerified } = opts;
  // Пробрасываем роль в клиент
  const db = businessId ? createIsolatedClient(businessId, platformRole) : null;

  return {
    prisma,
    db,
    userId: userId ?? null,
    businessId: businessId ?? null,
    platformRole: platformRole ?? ("NONE" as PlatformRole),
    is2FAVerified: is2FAVerified ?? false,
  };
};

/**
 * Основной контекст для API запросов
 */
export const createTRPCContext = async (opts: { req: Request }) => {
  const userId = opts.req.headers.get("x-user-id");
  const businessId = opts.req.headers.get("x-business-id");
  const platformRole = (opts.req.headers.get("x-platform-role") || "NONE") as PlatformRole;
  const is2FAVerified = opts.req.headers.get("x-2fa-verified") === "true";

  return createInnerTRPCContext({
    userId,
    businessId,
    platformRole,
    is2FAVerified,
  });
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    data: {
      ...shape.data,
      zodError: error.cause instanceof ZodError ? error.cause.issues : null,
    },
  }),
});

/**
 * [EVA_FIX]: Гранулярный Middleware для тестов и безопасности.
 * Разделяем ошибки 401 (нет юзера) и 400 (нет бизнеса).
 */
const isAuthed = t.middleware(({ next, ctx }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "User not identified" });
  }
  if (!ctx.businessId || !ctx.db) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Business context missing" });
  }
  return next({
    ctx: {
      userId: ctx.userId,
      businessId: ctx.businessId,
      db: ctx.db,
    },
  });
});

const isAdmin = t.middleware(({ next, ctx }) => {
  if (ctx.platformRole !== "ROOT" && ctx.platformRole !== "CO_SU") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin privileges required" });
  }
  return next({ ctx });
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
export const adminProcedure = t.procedure.use(isAdmin);
export { TRPCError };
