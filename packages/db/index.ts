// packages/db/index.ts
import { PrismaClient } from "@prisma/client";
import { prismaConfig } from "./prisma.config";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Основной инстанс Prisma для системных операций.
 */
export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaConfig);

if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * [CRITICAL] Isolated Client для обеспечения Multi-tenancy.
 * Автоматически инжектит businessId во все CRUD операции.
 */
export const createIsolatedClient = (businessId: string) => {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Модели, требующие изоляции на уровне бизнеса
          const tenantModels = ["Unit", "Enterprise", "User"];

          if (tenantModels.includes(model)) {
            if (operation === "create") {
              // @ts-expect-error - Prisma extension types can be tricky
              args.data.businessId = businessId;
            } else if (
              [
                "findFirst",
                "findUnique",
                "findMany",
                "update",
                "updateMany",
                "delete",
                "deleteMany",
              ].includes(operation)
            ) {
              // @ts-expect-error - Inject businessId filter
              args.where = { ...args.where, businessId };
            }
          }
          return query(args);
        },
      },
    },
  });
};

export type IsolatedPrismaClient = ReturnType<typeof createIsolatedClient>;
export * from "@prisma/client";
