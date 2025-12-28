// packages/db/prisma.config.ts
import type { Prisma } from "@prisma/client";

/**
 * [EVAS_PROTIP]: Для тестов мы отключаем логирование запросов 'query',
 * чтобы не забивать консоль при массовых операциях очистки/сидинга.
 */
const getLogConfig = (): Prisma.LogLevel[] => {
  if (process.env.NODE_ENV === "test") {
    return ["error", "warn"];
  }
  if (process.env.NODE_ENV === "development") {
    return ["query", "info", "warn", "error"];
  }
  return ["error"];
};

export const prismaConfig: Prisma.PrismaClientOptions = {
  log: getLogConfig(),
  errorFormat: "pretty",
};

export default prismaConfig;
