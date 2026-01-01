// packages/db/index.ts

import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "@prisma/client"; // [EVA_FIX]: Нативный ESM-импорт CJS пакета
import pg from "pg";
import { dbUrl } from "./env.js"; // [CRITICAL]: Возвращаем изолированный загрузчик env.js

/**
 * [EVA_FIX]: Деструктуризация из Default Import решает SyntaxError в Node 24.
 * Node.js видит весь пакет как один объект и позволяет достать Prisma и PrismaClient.
 */
const { PrismaClient, Prisma } = pkg;

const pool = new pg.Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "test" ? [] : ["query", "info", "warn", "error"],
});

/**
 * [EVA_NO_ANY]: Строгие интерфейсы для DMMF и аргументов, чтобы удовлетворить Biome.
 */
interface DmmfField {
  name: string;
}

interface DmmfModel {
  name: string;
  fields: DmmfField[];
}

interface PrismaDmmf {
  datamodel: {
    models: DmmfModel[];
  };
}

interface PrismaGlobal {
  dmmf: PrismaDmmf;
}

interface PrismaArguments {
  where?: Record<string, unknown>;
  data?: unknown;
}

/**
 * Изолированный клиент (Multitenancy + Soft Delete).
 */
export const createIsolatedClient = (businessId: string | null, platformRole: string = "NONE") => {
  // ROOT и CO_SU видят всё, включая архивные записи
  if (platformRole === "ROOT" || platformRole === "CO_SU") {
    return prisma;
  }

  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          /**
           * [EVA_CREATIVE]: Используем 'unknown' и приведение к нашим интерфейсам.
           * Это полностью убирает 'any' и гарантирует типобезопасность рантайм-метаданных.
           */
          const dmmf = (Prisma as unknown as PrismaGlobal).dmmf;
          const modelMetadata = dmmf.datamodel.models.find((m) => m.name === model);

          const hasBusinessId = modelMetadata?.fields.some((f) => f.name === "businessId") ?? false;
          const hasIsArchived = modelMetadata?.fields.some((f) => f.name === "isArchived") ?? false;

          const extendedArgs = args as PrismaArguments;

          // 1. Обработка фильтрации (Read, Update, Delete)
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
            extendedArgs.where = { ...(extendedArgs.where || {}) };

            if (hasBusinessId) {
              if (!businessId) {
                throw new Error("UNAUTHORIZED: Business ID is required for isolation-enabled models");
              }
              extendedArgs.where.businessId = businessId;
            }

            if (hasIsArchived) {
              extendedArgs.where.isArchived = false;
            }
          }

          // 2. Обработка создания (Single & Batch)
          if ((operation === "create" || operation === "createMany") && hasBusinessId) {
            if (operation === "create") {
              const currentData = (extendedArgs.data || {}) as Record<string, unknown>;
              extendedArgs.data = { ...currentData, businessId };
            } else if (Array.isArray(extendedArgs.data)) {
              extendedArgs.data = extendedArgs.data.map((item: unknown) => {
                const record = item as Record<string, unknown>;
                return { ...record, businessId };
              });
            }
          }

          return query(extendedArgs);
        },
      },
    },
  });
};

// Реэкспортируем Prisma и типы для других пакетов (api, etc.)
export { Prisma };
export type { PrismaClient as PrismaClientType } from "@prisma/client";
