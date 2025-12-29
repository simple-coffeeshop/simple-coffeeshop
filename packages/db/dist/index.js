// packages/db/index.ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { prismaConfig } from "./prisma.config";
/**
 * [EVAS_SYNC]: Настройка драйвер-адаптера для PostgreSQL.
 * Это решает проблему "engine type client" в Prisma 7.
 */
const connectionString = prismaConfig.datasources?.db?.url;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const globalForPrisma = globalThis;
// Передаем созданный адаптер в конструктор PrismaClient
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ ...prismaConfig, adapter });
if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
/**
 * [CRITICAL] Isolated Client с поддержкой адаптера
 */
export const createIsolatedClient = (businessId) => {
    return prisma.$extends({
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }) {
                    const tenantModels = ["User", "Unit", "Enterprise", "Asset", "Handshake", "CustomRole"];
                    if (tenantModels.includes(model)) {
                        if (operation === "create") {
                            // @ts-expect-error - Injection
                            args.data.businessId = businessId;
                        }
                        else if ([
                            "findFirst",
                            "findUnique",
                            "findMany",
                            "update",
                            "updateMany",
                            "delete",
                            "deleteMany",
                        ].includes(operation)) {
                            // @ts-expect-error - Filter
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
