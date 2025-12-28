// packages/db/prisma.config.ts
import type { Prisma } from "@prisma/client";

/**
 * Глобальный конфиг Prisma для всего проекта.
 * Используется для стандартизации логирования и обработки ошибок.
 */
export const prismaConfig: Prisma.PrismaClientOptions = {
	log:
		process.env.NODE_ENV === "development"
			? ["query", "info", "warn", "error"]
			: ["error"],
	errorFormat: "pretty",
};

export default prismaConfig;
