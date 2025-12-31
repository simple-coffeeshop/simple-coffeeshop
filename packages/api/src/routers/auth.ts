// packages/api/src/routers/auth.ts
import { verify } from "argon2";
import { sign } from "jsonwebtoken";
import { z } from "zod";
import { publicProcedure, router, TRPCError } from "../trpc";

export const authRouter = router({
  login: publicProcedure
    .input(
      z.object({
        email: z.email(), // Исправлено: z.string().email()
        password: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const email = input.email.toLowerCase();

      // 1. Ищем пользователя
      const user = await ctx.prisma.user.findUnique({
        where: { email },
      });

      // 2. Сначала проверяем существование пользователя и хеша
      if (!user || !user.passwordHash) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
      }

      // 3. Проверяем паро findUniqueль
      const isValid = await verify(user.passwordHash, input.password);
      if (!isValid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
      }

      // 4. Безопасно получаем секрет
      const JWT_SECRET = process.env.JWT_SECRET;
      if (!JWT_SECRET) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "JWT_SECRET is not configured on the server",
        });
      }

      // 5. Генерируем один токен
      const token = sign({ userId: user.id }, JWT_SECRET);

      // 6. Создаем сессию в БД
      await ctx.prisma.session.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
        },
      });

      return { token, platformRole: user.platformRole };
    }),
});
