// packages/db/index.ts

import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "@prisma/client";
import pg from "pg";
import { dbUrl } from "./env.js"; // [EVA_FIX]: Обязательно env.js для изоляции от devDeps

const { PrismaClient, Prisma } = pkg;

/**
 * [EVA_NO_ANY]: Строгие интерфейсы для метаданных Prisma DMMF.
 * Это убирает все ошибки Biome (noExplicitAny).
 */
interface DmmfField {
  readonly name: string;
}

interface DmmfModel {
  readonly name: string;
  readonly fields: readonly DmmfField[];
}

interface PrismaGlobal {
  readonly dmmf: {
    readonly datamodel: {
      readonly models: readonly DmmfModel[];
    };
  };
}

interface PrismaArguments {
  where?: Record<string, unknown>;
  data?: unknown;
}

const pool = new pg.Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "test" ? [] : ["query", "info", "warn", "error"],
});

/**
 * [EVA_STRATEGY]: Изолированный клиент (Multitenancy + Soft Delete).
 */
export const createIsolatedClient = (businessId: string | null, platformRole: string = "NONE") => {
  // ROOT и CO_SU видят всё
  if (platformRole === "ROOT" || platformRole === "CO_SU") {
    return prisma;
  }

  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
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
                throw new Error("UNAUTHORIZED: Business ID is required for isolation-enabled models");
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
              extendedArgs.data = extendedArgs.data.map((item: unknown) => ({
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

/**
 * [EVA_FIX]: Экспорт ЗНАЧЕНИЙ (Value Space) для рантайма ESM.
 * Это решает SyntaxError: 'does not provide an export named X'.
 */
export const { PlatformRole, HandshakeStatus, UserRole, Capability, AssetStatus } = pkg;

/**
 * [EVA_FIX]: Используем 'export type *' для проброса типов моделей (User, Business и т.д.)
 * и типов Enums. Это НЕ создает коллизий с константами выше.
 * МЫ УБРАЛИ ручной экспорт типов 'export type { PlatformRole ... }', так как
 * он вызывал TS2323 при наличии 'export type *'.
 */
export type * from "@prisma/client";
export { Prisma };
