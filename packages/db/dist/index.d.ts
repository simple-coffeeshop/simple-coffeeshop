import { PrismaClient } from "@prisma/client";
/**
 * Инициализация клиента.
 * Если после этого будет ошибка Runtime про "Adapter",
 * нам нужно будет установить @prisma/adapter-pg, но сейчас чиним ТИПЫ.
 */
export declare const prisma: PrismaClient<
  import("@prisma/client").Prisma.PrismaClientOptions,
  never,
  import("@prisma/client/runtime/client").DefaultArgs
>;
export * from "@prisma/client";
//# sourceMappingURL=index.d.ts.map
