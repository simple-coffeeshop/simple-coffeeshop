// packages/db/index.ts
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { dbUrl, prismaConfig } from "./prisma.config";

/**
 * [EVAS_SYNC]: Используем драйвер-адаптер pg для поддержки Prisma 7.
 * Это убирает ошибку "engine type client" и типизирует connectionString.
 */
const pool = new Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ ...prismaConfig, adapter });

if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * [CRITICAL] Isolated Client для обеспечения Multi-tenancy.
 * Динамически инжектит businessId во все операции для моделей, где это поле присутствует.
 */
export const createIsolatedClient = (businessId: string) => {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Динамическое определение тенант-моделей через метаданные DMMF
          const modelMeta = Prisma.dmmf.datamodel.models.find((m) => m.name === model);
          const isTenantModel = modelMeta?.fields.some((f) => f.name === "businessId");

          if (isTenantModel) {
            // Типизируем args для безопасного доступа к data и where
            const typedArgs = args as {
              data?: { businessId?: string };
              where?: { businessId?: string };
            };

            // Исправление findUnique -> findFirst для поддержки фильтра businessId
            if (operation === "findUnique") {
              operation = "findFirst";
            }

            if (operation === "create") {
              typedArgs.data = { ...typedArgs.data, businessId };
            } else if (["findFirst", "findMany", "update", "updateMany", "delete", "deleteMany"].includes(operation)) {
              typedArgs.where = { ...typedArgs.where, businessId };
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
