// packages/api/src/trpc.ts
import { createIsolatedClient, prisma } from "@simple-coffeeshop/db";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

/**
 * [EVAS_SYNC]: Контекст tRPC теперь передает и глобальный prisma,
 * и изолированный db клиент.
 */
export const createTRPCContext = async (opts: { req: Request }) => {
  const userId = opts.req.headers.get("x-user-id");
  const businessId = opts.req.headers.get("x-business-id");

  const db = businessId ? createIsolatedClient(businessId) : null;

  return {
    prisma, // Глобальный клиент (для поиска пользователя по email при login)
    db, // Изолированный клиент (для бизнес-операций)
    userId,
    businessId,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten : null,
      },
    };
  },
});

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

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
export { TRPCError };
