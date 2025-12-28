import { TRPCError } from "@trpc/server";
export declare const createTRPCContext: (opts: { req: Request }) => Promise<{
  db: import("@prisma/client").PrismaClient<
    import("@prisma/client").Prisma.PrismaClientOptions,
    never,
    import("@prisma/client/runtime/client").DefaultArgs
  >;
  userId: string | null;
}>;
export declare const router: import("@trpc/server").TRPCRouterBuilder<{
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
}>;
export declare const publicProcedure: import("@trpc/server").TRPCProcedureBuilder<
  {
    db: import("@prisma/client").PrismaClient<
      import("@prisma/client").Prisma.PrismaClientOptions,
      never,
      import("@prisma/client/runtime/client").DefaultArgs
    >;
    userId: string | null;
  },
  object,
  object,
  import("@trpc/server").TRPCUnsetMarker,
  import("@trpc/server").TRPCUnsetMarker,
  import("@trpc/server").TRPCUnsetMarker,
  import("@trpc/server").TRPCUnsetMarker,
  false
>;
export { TRPCError };
//# sourceMappingURL=trpc.d.ts.map
