// packages/db/index.ts
import { PrismaClient } from "@prisma/client";
import { prismaConfig } from "./prisma.config";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaConfig);

if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * [CRITICAL] Isolated Client для обеспечения Multi-tenancy.
 * Обновлен под актуальные модели: Unit, Enterprise, Member.
 */
export const createIsolatedClient = (businessId: string) => {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Модели из network.prisma, имеющие поле businessId
          const tenantModels = ["Unit", "Enterprise", "Member"];

          if (tenantModels.includes(model)) {
            if (operation === "create") {
              // @ts-expect-error - Инъекция бизнес-ключа
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
              // @ts-expect-error - Фильтрация по бизнес-ключу
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
