// packages/db/index.ts
import { PrismaClient } from "@prisma/client";
import { prismaConfig } from "./prisma.config"; // Исправлен путь: файл лежит в той же папке

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Инициализация основного клиента Prisma.
 */
export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaConfig);

if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export * from "@prisma/client";
