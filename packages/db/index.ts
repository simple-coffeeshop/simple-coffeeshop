// packages/db/index.ts

import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "@prisma/client"; // [EVA_FIX]: Нативный ESM-импорт CJS пакета
import pg from "pg";
import { dbUrl } from "./env.js";

const { PrismaClient, Prisma } = pkg;

const pool = new pg.Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "test" ? [] : ["query", "info", "warn", "error"],
});

/**
 * [EVA_FIX]: Полное избавление от 'any'. Используем unknown + строгие интерфейсы.
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
  if (platformRole === "ROOT" || platformRole === "CO_SU") {
    return prisma;
  }

  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Безопасное приведение через unknown для доступа к внутренним метаданным Prisma
          const dmmf = (Prisma as unknown as PrismaGlobal).dmmf;
          const modelMetadata = dmmf.datamodel.models.find((m) => m.name === model);

          const hasBusinessId = modelMetadata?.fields.some((f) => f.name === "businessId") ?? false;
          const hasIsArchived = modelMetadata?.fields.some((f) => f.name === "isArchived") ?? false;

          const extendedArgs = args as PrismaArguments;

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
                // [EVA_FIX]: Запоминаем эту строку для теста!
                throw new Error("UNAUTHORIZED: Business ID required for isolation-enabled models");
              }
              extendedArgs.where.businessId = businessId;
            }

            if (hasIsArchived) {
              extendedArgs.where.isArchived = false;
            }
          }

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

export { Prisma };
export type { PrismaClient as PrismaClientType } from "@prisma/client";
