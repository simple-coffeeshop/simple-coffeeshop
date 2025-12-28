// packages/db/src/index.ts
import { PrismaClient } from "@prisma/client";
import { prismaConfig } from "../prisma.config";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaConfig);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * [EVAS_PROTIP]: Мы расширяем клиент Prisma, чтобы он автоматически
 * добавлял фильтр businessId ко всем запросам.
 * Это предотвращает утечку данных между арендаторами.
 */
export const createIsolatedClient = (businessId: string) => {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Список моделей, которые являются глобальными (не требуют businessId)
          const globalModels = ["Business"];

          if (globalModels.includes(model)) {
            return query(args);
          }

          // Для всех остальных моделей внедряем фильтр businessId
          if (["findMany", "findFirst", "count", "updateMany", "deleteMany"].includes(operation)) {
            args.where = { ...args.where, businessId };
          }

          if (["create", "createMany"].includes(operation)) {
            if (Array.isArray(args.data)) {
              args.data = args.data.map((item: any) => ({ ...item, businessId }));
            } else {
              args.data = { ...args.data, businessId };
            }
          }

          return query(args);
        },
      },
    },
  });
};

export type IsolatedPrismaClient = ReturnType<typeof createIsolatedClient>;
