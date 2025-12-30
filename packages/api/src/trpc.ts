// packages/api/src/trpc.ts

import type { PlatformRole } from "@simple-coffeeshop/db"; // [FIX]: Импорт типа
import { createIsolatedClient, prisma } from "@simple-coffeeshop/db";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError, z } from "zod";

/**
 * [NEW]: Внутренний контекст для тестов и внутренних вызовов
 */
export const createInnerTRPCContext = (opts: {
  userId: string | null;
  businessId: string | null;
  platformRole: PlatformRole;
  is2FAVerified: boolean;
}) => {
  const db = createIsolatedClient(opts.businessId, opts.platformRole);
  return {
    prisma,
    db,
    ...opts,
  };
};

export const createTRPCContext = async (opts: { req: Request }) => {
  const userId = opts.req.headers.get("x-user-id");
  const businessId = opts.req.headers.get("x-business-id");

  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { platformRole: true, is2FAEnabled: true },
      })
    : null;

  const platformRole = user?.platformRole ?? "NONE";

  return createInnerTRPCContext({
    userId,
    businessId,
    platformRole,
    is2FAVerified: !user?.is2FAEnabled,
  });
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? z.formatError(error.cause) : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const rootProcedure = t.procedure.use(({ ctx, next }) => {
  if (ctx.platformRole !== "ROOT") {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Требуются права ROOT" });
  }
  return next({ ctx });
});

export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  if (ctx.platformRole === "NONE") {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Доступ только админам платформы" });
  }
  return next({ ctx });
});

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { userId: ctx.userId, db: ctx.db } });
});
