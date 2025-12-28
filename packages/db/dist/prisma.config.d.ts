import type { Prisma } from "@prisma/client";
/**
 * [EVAS_PROTIP]: Мы используем явное приведение к Prisma.LogLevel[],
 * чтобы TypeScript не ругался на несовпадение типов строк.
 */
declare const _default: import("prisma/config").PrismaConfigInternal;
export default _default;
export declare const prismaConfig: {
    readonly log: Prisma.LogLevel[];
    readonly errorFormat: "pretty";
};
//# sourceMappingURL=prisma.config.d.ts.map