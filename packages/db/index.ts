// packages/db/src/index.ts
import { type PlatformRole, PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

/**
 * Улучшенный Isolated Client с поддержкой SU/CO_SU и строгой типизацией
 */
export const createIsolatedClient = (businessId: string | null, platformRole: PlatformRole = "NONE") => {
  // 1. Если это ROOT или CO_SU, возвращаем "чистый" клиент без фильтров
  if (platformRole === "ROOT" || platformRole === "CO_SU") {
    return prisma;
  }

  // 2. Если businessId не передан для обычного пользователя — это ошибка безопасности
  if (!businessId) {
    throw new Error("UNAUTHORIZED: Business ID is required for non-SU roles.");
  }

  // 3. Накладываем изоляцию через расширение
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Модели, требующие изоляции по businessId
          const tenantModels = ["Unit", "Member", "Enterprise", "Asset", "Handshake", "CustomRole"];

          if (tenantModels.includes(model)) {
            // Используем Record<string, unknown> вместо any для линтера
            const extendedArgs = args as Record<string, unknown>;

            // Операции чтения/правки, поддерживающие фильтр 'where'
            const whereOperations = [
              "findFirst",
              "findFirstOrThrow",
              "findMany",
              "update",
              "updateMany",
              "upsert",
              "delete",
              "deleteMany",
              "count",
              "aggregate",
            ];

            if (whereOperations.includes(operation)) {
              extendedArgs.where = {
                ...((extendedArgs.where as Record<string, unknown>) || {}),
                businessId,
              };
            }

            // Операция создания: инъекция businessId в данные
            if (operation === "create") {
              extendedArgs.data = {
                ...((extendedArgs.data as Record<string, unknown>) || {}),
                businessId,
              };
            }

            if (operation === "createMany") {
              const data = extendedArgs.data;
              if (Array.isArray(data)) {
                extendedArgs.data = data.map((item) => ({
                  ...(item as Record<string, unknown>),
                  businessId,
                }));
              }
            }

            return query(extendedArgs);
          }

          return query(args);
        },
      },
    },
  });
};

export * from "@prisma/client";
