// packages/db/index.ts [CURRENT]
import { PrismaPg } from "@prisma/adapter-pg";
// [EVA_FIX]: Импортируем типы отдельно для последующего экспорта
import type {
  Business as PrismaBusiness,
  Capability as PrismaCapability,
  Handshake as PrismaHandshake,
  HandshakeStatus as PrismaHandshakeStatus,
  PlatformRole as PrismaPlatformRole,
  Unit as PrismaUnit,
  User as PrismaUser,
  UserRole as PrismaUserRole,
} from "@prisma/client";
import pkg from "@prisma/client";
import pg from "pg";
import { validateDbUrl } from "./env.js";

const validatedUrl = validateDbUrl();
const { PrismaClient, Prisma } = pkg;

const pool = new pg.Pool({ connectionString: validatedUrl });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "test" ? [] : ["query", "info", "warn", "error"],
});

export const { PlatformRole, UserRole, HandshakeStatus, AssetStatus, Capability } = pkg;

export type CapabilityType = PrismaCapability;
export type BusinessType = PrismaBusiness;
export type UnitType = PrismaUnit;
export type UserType = PrismaUser;
export type HandshakeType = PrismaHandshake;
export type HandshakeStatusType = PrismaHandshakeStatus;
export type PlatformRoleType = PrismaPlatformRole;
export type UserRoleType = PrismaUserRole;

export { Prisma };

/**
 * Интерфейс для безопасного манипулирования аргументами Prisma без использования any.
 */
interface PrismaQueryArgs {
  where?: Record<string, unknown>;
  data?: Record<string, unknown> | Record<string, unknown>[];
}

/**
 * [EVA_FIX]: Фабрика изолированного клиента.
 * Поддерживает Multitenancy, Soft Delete и God-mode для ROOT.
 */
export const createIsolatedClient = (businessId: string | null, role: pkg.PlatformRole = "NONE") => {
  /**
   * [EVA_FIX]: Для ROOT возвращаем оригинальный инстанс.
   * Это обеспечивает прохождение теста на идентичность (toBe) и доступ к архивным данным.
   */
  if (role === "ROOT") {
    return prisma;
  }

  /**
   * Возвращаем расширенный клиент. Валидация businessId теперь ленивая (внутри запроса),
   * что соответствует ожиданиям интеграционных тестов.
   */
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ operation, args, query }) {
          if (!businessId) {
            throw new Error("UNAUTHORIZED: Business ID is required for isolation-enabled models");
          }

          const typedArgs = args as PrismaQueryArgs;

          /**
           * 1. Операции ЧТЕНИЯ: Инъекция businessId и фильтр Soft Delete.
           */
          if (["findFirst", "findMany", "count", "findFirstOrThrow", "aggregate"].includes(operation)) {
            typedArgs.where = {
              ...typedArgs.where,
              businessId,
              isArchived: false,
            };
          }

          /**
           * 2. Операции СОЗДАНИЯ: Автоматическая привязка к тенанту.
           */
          if (operation === "create" && typedArgs.data && !Array.isArray(typedArgs.data)) {
            typedArgs.data = { ...typedArgs.data, businessId };
          }

          /**
           * 3. Операции ОБНОВЛЕНИЯ/УДАЛЕНИЯ: Ограничение областью тенанта.
           */
          if (["update", "updateMany", "upsert", "delete", "deleteMany"].includes(operation)) {
            typedArgs.where = { ...typedArgs.where, businessId };
          }

          return query(args);
        },
      },
    },
  });
};
