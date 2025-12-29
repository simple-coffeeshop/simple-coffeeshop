import { z } from "zod";
export declare const authRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: {
        prisma: import("@prisma/client").PrismaClient<import("@prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/client").DefaultArgs>;
        db: import("@prisma/client/runtime/client").DynamicClientExtensionThis<import("@prisma/client").Prisma.TypeMap<import("@prisma/client/runtime/client").InternalArgs & {
            result: {};
            model: {};
            query: {};
            client: {};
        }, {}>, import("@prisma/client").Prisma.TypeMapCb<import("@prisma/client").Prisma.PrismaClientOptions>, {
            result: {};
            model: {};
            query: {};
            client: {};
        }> | null;
        userId: string | null;
        businessId: string | null;
    };
    meta: object;
    errorShape: {
        data: {
            zodError: {
                (): z.core.$ZodFlattenedError<unknown, string>;
                <U>(mapper: (issue: z.core.$ZodIssue) => U): z.core.$ZodFlattenedError<unknown, U>;
            } | null;
            code: import("@trpc/server").TRPC_ERROR_CODE_KEY;
            httpStatus: number;
            path?: string;
            stack?: string;
        };
        message: string;
        code: import("@trpc/server").TRPC_ERROR_CODE_NUMBER;
    };
    transformer: true;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    requestMagicLink: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            email: string;
        };
        output: {
            success: boolean;
        };
        meta: object;
    }>;
    verify: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            token: string;
        };
        output: {
            token: string;
            businessId: string;
        };
        meta: object;
    }>;
}>>;
//# sourceMappingURL=auth.d.ts.map