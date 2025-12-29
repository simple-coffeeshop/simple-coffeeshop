// packages/api/src/trpc.ts
import { createIsolatedClient, prisma } from "@simple-coffeeshop/db";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError, z } from "zod"; // Импортируем 'z' для доступа к хелперам

export const createTRPCContext = async (opts: { req: Request }) => {
  const userId = opts.req.headers.get("x-user-id");
  const businessId = opts.req.headers.get("x-business-id");

  // Получаем роль платформы для God-mode
  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { platformRole: true, is2FAEnabled: true },
      })
    : null;

  const platformRole = user?.platformRole ?? "NONE";

  // Изолированный клиент с поддержкой SU/CO_SU
  const db = createIsolatedClient(businessId, platformRole);

  return {
    prisma,
    db,
    userId,
    businessId,
    platformRole,
    is2FAVerified: !user?.is2FAEnabled, // Заглушка 2FA
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        // [FIX]: Zod v4. Используем функциональный z.formatError вместо метода экземпляра
        zodError: error.cause instanceof ZodError ? z.formatError(error.cause) : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * ROOT Procedure: Только для ROOT роли
 */
export const rootProcedure = t.procedure.use(({ ctx, next }) => {
  if (ctx.platformRole !== "ROOT") {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Требуются права ROOT",
    });
  }
  return next({ ctx });
});

/**
 * Admin Procedure: Для SU и CO_SU
 */
export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  if (ctx.platformRole === "NONE") {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Доступ разрешен только администраторам платформы",
    });
  }
  return next({ ctx });
});

/**
 * Обычная процедура тенанта
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      userId: ctx.userId,
      db: ctx.db,
    },
  });
});
