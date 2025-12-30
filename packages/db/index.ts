// packages/db/index.ts

import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";
import pg from "pg";
import { dbUrl } from "./prisma.config";

const pool = new pg.Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "test" ? [] : ["query", "info", "warn", "error"],
});

export const createIsolatedClient = (businessId: string | null, platformRole: string = "NONE") => {
  // ROOT и CO_SU видят всё, включая архивные записи тенантов
  if (platformRole === "ROOT" || platformRole === "CO_SU") {
    return prisma;
  }

  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const modelMetadata = Prisma.dmmf.datamodel.models.find((m) => m.name === model);
          const hasBusinessId = modelMetadata?.fields.some((f) => f.name === "businessId");
          const hasIsArchived = modelMetadata?.fields.some((f) => f.name === "isArchived");

          const extendedArgs = args as Record<string, unknown>;

          // 1. Обработка фильтрации (Чтение, Обновление, Удаление)
          const whereOps = [
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

          if (whereOps.includes(operation)) {
            extendedArgs.where = {
              ...((extendedArgs.where as Record<string, unknown>) || {}),
            };

            // Принудительная изоляция по бизнесу
            if (hasBusinessId) {
              if (!businessId) {
                throw new Error("UNAUTHORIZED: Business ID is required for isolation-enabled models");
              }
              // [FIX]: Добавляем само условие фильтрации (его не было в твоем наброске)
              (extendedArgs.where as Record<string, unknown>).businessId = businessId;
            }

            // Автоматический Soft Delete
            if (hasIsArchived) {
              (extendedArgs.where as Record<string, unknown>).isArchived = false;
            }
          }

          // 2. Обработка создания (Одиночное)
          if (operation === "create" && hasBusinessId) {
            extendedArgs.data = {
              ...((extendedArgs.data as Record<string, unknown>) || {}),
              businessId,
            };
          }

          // 3. Обработка создания (Множественное)
          if (operation === "createMany" && hasBusinessId) {
            const data = extendedArgs.data;
            if (Array.isArray(data)) {
              extendedArgs.data = data.map((item: unknown) => ({
                ...(item as Record<string, unknown>),
                businessId,
              }));
            }
          }

          return query(extendedArgs);
        },
      },
    },
  });
};

export * from "@prisma/client";
