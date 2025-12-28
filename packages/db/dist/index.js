// packages/db/index.ts
import { PrismaClient } from "@prisma/client";
import { prismaConfig } from "./prisma.config";
const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaConfig);
// Тщательная проверка существования process для изоляции в Dev
if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
export * from "@prisma/client";
