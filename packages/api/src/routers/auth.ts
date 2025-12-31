// packages/api/src/routers/auth.ts
import { verify } from "argon2";
import jwt from "jsonwebtoken"; // [EVA_FIX]: Импортируем как default для совместимости с ESM
import { z } from "zod";
import { publicProcedure, router, TRPCError } from "../trpc";

export const authRouter = router({
  login: publicProcedure
    .input(
      z.object({
        email: z.email(),
        password: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const email = input.email.toLowerCase();

      const user = await ctx.prisma.user.findUnique({
        where: { email },
      });

      if (!user || !user.passwordHash) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
      }

      const isValid = await verify(user.passwordHash, input.password);
      if (!isValid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
      }

      const JWT_SECRET = process.env.JWT_SECRET;
      if (!JWT_SECRET) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "JWT_SECRET is not configured on the server",
        });
      }

      // [EVA_FIX]: Используем jwt.sign вместо именованного импорта
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
        expiresIn: "7d",
      });

      await ctx.prisma.session.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        },
      });

      return { token, platformRole: user.platformRole };
    }),
});
