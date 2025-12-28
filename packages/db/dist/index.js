import { PrismaClient } from "@prisma/client";
import { prismaConfig } from "./prisma.config";

const globalForPrisma = globalThis;
/**
 * Инициализация клиента.
 * Если после этого будет ошибка Runtime про "Adapter",
 * нам нужно будет установить @prisma/adapter-pg, но сейчас чиним ТИПЫ.
 */
export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaConfig);
if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export * from "@prisma/client";
