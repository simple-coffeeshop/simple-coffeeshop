// packages/db/index.ts
import { PrismaClient } from "@prisma/client";
import { prismaConfig } from "./prisma.config"; // Импорт должен совпадать с экспортной константой

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaConfig);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export * from "@prisma/client";
