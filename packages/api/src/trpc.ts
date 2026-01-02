// packages/api/src/trpc.ts [АКТУАЛЬНО]
import { createIsolatedClient, type PlatformRoleType, prisma } from "@simple-coffeeshop/db";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

export const createInnerTRPCContext = (opts: {
  userId?: string | null;
  businessId?: string | null;
  platformRole?: PlatformRoleType | string;
  is2FAVerified?: boolean;
}) => {
  const { businessId, platformRole, userId, is2FAVerified } = opts;
  const role = (platformRole || "NONE") as PlatformRoleType;

  // [EVA_FIX]: ROOT видит всё через обычную призму, остальные — через изолятор
  const db = role === "ROOT" || role === "CO_SU" ? prisma : businessId ? createIsolatedClient(businessId, role) : null;

  return {
    prisma,
    db,
    userId: userId ?? null,
    businessId: businessId ?? null,
    platformRole: role,
    is2FAVerified: is2FAVerified ?? false,
  };
};

export const createTRPCContext = async (opts: { req: Request }) => {
  const userId = opts.req.headers.get("x-user-id");
  const businessId = opts.req.headers.get("x-business-id");
  const platformRole = opts.req.headers.get("x-platform-role") || "NONE";
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
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.issues : null,
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

const isAdmin = t.middleware(({ next, ctx }) => {
  // Теперь типизация ctx.platformRole корректно подтягивается из PlatformRole енума
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
