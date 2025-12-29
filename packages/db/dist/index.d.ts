import { PrismaClient } from "@prisma/client";
export declare const prisma: PrismaClient<import("@prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/client").DefaultArgs>;
/**
 * [CRITICAL] Isolated Client для обеспечения Multi-tenancy.
 * Автоматически инжектит businessId во все операции.
 */
export declare const createIsolatedClient: (businessId: string) => import("@prisma/client/runtime/client").DynamicClientExtensionThis<import("@prisma/client").Prisma.TypeMap<import("@prisma/client/runtime/client").InternalArgs & {
    result: {};
    model: {};
    query: {};
    client: {};
}, {}>, import("@prisma/client").Prisma.TypeMapCb<import("@prisma/client").Prisma.PrismaClientOptions>, {
    result: {};
    model: {};
    query: {};
    client: {};
}>;
export type IsolatedPrismaClient = ReturnType<typeof createIsolatedClient>;
export * from "@prisma/client";
//# sourceMappingURL=index.d.ts.map