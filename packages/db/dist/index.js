// packages/db/index.ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { dbUrl, prismaConfig } from "./prisma.config";
/**
 * [EVAS_SYNC]: Используем драйвер-адаптер pg для поддержки Prisma 7.
 * Это убирает ошибку "engine type client" и типизирует connectionString.
 */
const pool = new Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ ...prismaConfig, adapter });
if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
/**
 * [CRITICAL] Isolated Client для обеспечения Multi-tenancy.
 * Автоматически инжектит businessId во все операции.
 */
export const createIsolatedClient = (businessId) => {
    return prisma.$extends({
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }) {
                    const tenantModels = [
                        "User",
                        "Unit",
                        "Enterprise",
                        "Asset",
                        "Handshake",
                        "CustomRole",
                        "PermissionOverride",
                        "UserCustomRole",
                    ];
                    if (tenantModels.includes(model)) {
                        // Исправление findUnique -> findFirst для поддержки фильтра businessId
                        if (operation === "findUnique") {
                            operation = "findFirst";
                        }
                        if (operation === "create") {
                            // @ts-expect-error
                            args.data.businessId = businessId;
                        }
                        else if (["findFirst", "findMany", "update", "updateMany", "delete", "deleteMany"].includes(operation)) {
                            // @ts-expect-error
                            args.where = { ...args.where, businessId };
                        }
                    }
                    return query(args);
                },
            },
        },
    });
};
export * from "@prisma/client";
