// packages/api/src/trpc.ts
import { createIsolatedClient, prisma } from "@simple-coffeeshop/db";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { logger } from "./lib/logger";

export const createTRPCContext = async (opts: { req: Request }) => {
  const userId = opts.req.headers.get("x-user-id");
  const businessId = opts.req.headers.get("x-business-id");
  const db = businessId ? createIsolatedClient(businessId) : null;

  return {
    prisma,
    db,
    userId,
    businessId,
    logger,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// Middleware для логирования и мониторинга производительности
const loggingMiddleware = t.middleware(async ({ path, type, next, ctx }) => {
  const start = Date.now();
  const result = await next();
  const durationMs = Date.now() - start;

  const meta = { path, type, durationMs, userId: ctx.userId, success: result.ok };

  if (!result.ok) {
    ctx.logger.error({ ...meta, error: result.error }, `[tRPC Error] ${path}`);
  } else {
    ctx.logger.info(meta, `[tRPC Success] ${path}`);
  }

  return result;
});

export const router = t.router;
export const publicProcedure = t.procedure.use(loggingMiddleware);
export const protectedProcedure = t.procedure.use(loggingMiddleware).use(
  t.middleware(({ next, ctx }) => {
    if (!ctx.userId || !ctx.db) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
      ctx: { userId: ctx.userId, businessId: ctx.businessId as string, db: ctx.db },
    });
  }),
);
