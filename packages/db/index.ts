// packages/db/index.ts

import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "@prisma/client"; // [EVA_FIX]: Нативный ESM-импорт CJS пакета
import pg from "pg";
import { dbUrl } from "./env.js";

/**
 * [EVA_FIX]: Деструктуризация из Default Import решает SyntaxError в Node 24.
 */
const { PrismaClient, Prisma } = pkg;

const pool = new pg.Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "test" ? [] : ["query", "info", "warn", "error"],
});

/**
 * [EVA_NO_ANY]: Строгие интерфейсы для DMMF.
 */
interface DmmfField {
  name: string;
}
interface DmmfModel {
  name: string;
  fields: DmmfField[];
}
interface PrismaDmmf {
  datamodel: { models: DmmfModel[] };
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
          const dmmf = (Prisma as unknown as PrismaGlobal).dmmf;
          const modelMetadata = dmmf.datamodel.models.find((m: DmmfModel) => m.name === model);

          const hasBusinessId = modelMetadata?.fields.some((f: DmmfField) => f.name === "businessId") ?? false;
          const hasIsArchived = modelMetadata?.fields.some((f: DmmfField) => f.name === "isArchived") ?? false;

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
                // [EVA_FIX]: Фиксируем строку ошибки: "is required"
                throw new Error("UNAUTHORIZED: Business ID is required for isolation-enabled models");
              }
              extendedArgs.where.businessId = businessId;
            }
            if (hasIsArchived) extendedArgs.where.isArchived = false;
          }

          if ((operation === "create" || operation === "createMany") && hasBusinessId) {
            if (operation === "create") {
              const currentData = (extendedArgs.data || {}) as Record<string, unknown>;
              extendedArgs.data = { ...currentData, businessId };
            } else if (Array.isArray(extendedArgs.data)) {
              extendedArgs.data = (extendedArgs.data as unknown[]).map((item: unknown) => {
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

/**
 * [EVA_FIX]: Явный экспорт енумов и типов. Решает TS2305 и TS2749.
 * Теперь они доступны и как рантайм-значения, и как типы.
 */
export const { PlatformRole, UserRole, HandshakeStatus, AssetStatus, Capability } = pkg;

export type {
  Business,
  Handshake,
  HandshakeStatus as HandshakeStatusType,
  PlatformRole as PlatformRoleType,
  Unit,
  User,
  UserRole as UserRoleType,
} from "@prisma/client";

export { Prisma };
