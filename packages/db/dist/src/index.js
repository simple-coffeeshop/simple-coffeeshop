// packages/db/src/index.ts
import { PrismaClient } from "@prisma/client";
import { prismaConfig } from "../prisma.config"; // Путь верный, если файл в src/index.ts
const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaConfig);
if (process.env.NODE_ENV !== "production")
    globalForPrisma.prisma = prisma;
/**
 * Изолированный клиент для Strict Multi-Tenancy.
 */
export const createIsolatedClient = (businessId) => {
    return prisma.$extends({
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }) {
                    // Модели без изоляции
                    const globalModels = ["Business"];
                    if (globalModels.includes(model)) {
                        return query(args);
                    }
                    // Приведение к any необходимо, так как args — это Union всех типов аргументов Prisma.
                    // Это стандартный паттерн для динамических расширений.
                    const a = args;
                    // Изоляция чтений и массовых обновлений
                    if (["findMany", "findFirst", "count", "updateMany", "deleteMany"].includes(operation)) {
                        a.where = { ...a.where, businessId };
                    }
                    // Изоляция создания
                    if (["create", "createMany"].includes(operation)) {
                        if (Array.isArray(a.data)) {
                            a.data = a.data.map((item) => ({ ...item, businessId }));
                        }
                        else {
                            a.data = { ...a.data, businessId };
                        }
                    }
                    return query(args);
                },
            },
        },
    });
};
