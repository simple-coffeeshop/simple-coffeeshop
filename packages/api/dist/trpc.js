// packages/api/src/trpc.ts
import { createIsolatedClient } from "@simple-coffeeshop/db";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
/**
 * [EVAS_SYNC]: Контекст tRPC теперь поддерживает Multi-tenancy.
 * Извлекаем businessId и создаем изолированный клиент.
 */
export const createTRPCContext = async (opts) => {
    const userId = opts.req.headers.get("x-user-id");
    const businessId = opts.req.headers.get("x-business-id");
    // Если businessId нет, используем глобальный prisma (для публичных или админ-задач)
    // Но для бизнес-логики мы форсируем IsolatedClient в middleware
    const db = businessId ? createIsolatedClient(businessId) : null;
    return {
        db,
        userId,
        businessId,
    };
};
const t = initTRPC.context().create({
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
/**
 * Middleware для проверки авторизации и наличия бизнес-контекста
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
            db: ctx.db, // Здесь гарантированно IsolatedClient
        },
    });
});
export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
export { TRPCError };
