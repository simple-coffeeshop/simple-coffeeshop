export declare const appRouter: import("@trpc/server").TRPCBuiltRouter<
  {
    ctx: {
      db: import("@prisma/client").PrismaClient<
        import("@prisma/client").Prisma.PrismaClientOptions,
        never,
        import("@prisma/client/runtime/client").DefaultArgs
      >;
      userId: string | null;
    };
    meta: object;
    errorShape: {
      data: {
        zodError: import("zod").ZodFlattenedError<unknown, string> | null;
        code: import("@trpc/server").TRPC_ERROR_CODE_KEY;
        httpStatus: number;
        path?: string;
        stack?: string;
      };
      message: string;
      code: import("@trpc/server").TRPC_ERROR_CODE_NUMBER;
    };
    transformer: true;
  },
  import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    auth: import("@trpc/server").TRPCBuiltRouter<
      {
        ctx: {
          db: import("@prisma/client").PrismaClient<
            import("@prisma/client").Prisma.PrismaClientOptions,
            never,
            import("@prisma/client/runtime/client").DefaultArgs
          >;
          userId: string | null;
        };
        meta: object;
        errorShape: {
          data: {
            zodError: import("zod").ZodFlattenedError<unknown, string> | null;
            code: import("@trpc/server").TRPC_ERROR_CODE_KEY;
            httpStatus: number;
            path?: string;
            stack?: string;
          };
          message: string;
          code: import("@trpc/server").TRPC_ERROR_CODE_NUMBER;
        };
        transformer: true;
      },
      import("@trpc/server").TRPCDecorateCreateRouterOptions<{
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
          };
          meta: object;
        }>;
      }>
    >;
  }>
>;
export type AppRouter = typeof appRouter;
//# sourceMappingURL=root.d.ts.map
