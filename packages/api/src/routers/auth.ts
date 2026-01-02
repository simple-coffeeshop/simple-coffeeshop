// packages/api/src/routers/auth.ts

import { TRPCError } from "@trpc/server";
import * as argon2 from "argon2";
import { z } from "zod";
import { publicProcedure, router } from "../trpc.js";

export const authRouter = router({
  /**
   * Валидация инвайта для Landing Page.
   */
  validateInvite: publicProcedure.input(z.object({ token: z.string() })).query(async ({ ctx, input }) => {
    const invite = await ctx.prisma.invite.findUnique({
      where: { token: input.token, isUsed: false },
    });

    if (!invite || invite.expiresAt < new Date()) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Срок действия приглашения истек или оно не существует",
      });
    }

    return invite;
  }),

  /**
   * Завершение онбординга.
   * Создает неразрывную связь (Hard Link) между User и EmployeeProfile.
   */
  completeRegistration: publicProcedure
    .input(
      z.object({
        token: z.string(),
        password: z.string().min(8),
        firstName: z.string(),
        lastName: z.string(),
        phone: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const invite = await ctx.prisma.invite.findUnique({
        where: { token: input.token, isUsed: false },
      });

      if (!invite || invite.expiresAt < new Date()) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Инвайт невалиден" });
      }

      return await ctx.prisma.$transaction(async (tx) => {
        const hashedPassword = await argon2.hash(input.password);

        // [EVA_FIX]: Устранение Forbidden non-null assertion.
        // Проверяем наличие привязки к бизнесу перед созданием профиля.
        if (!invite.businessId) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Приглашение не содержит ID бизнеса",
          });
        }

        const profile = await tx.employeeProfile.create({
          data: {
            // [EVA_FIX]: Замена invite.businessId! на безопасную проверку.
            // Это гарантирует, что мы не упадем с ошибкой рантайма, если инвайт поврежден.
            businessId:
              invite.businessId ??
              (() => {
                throw new Error("Invite must have a businessId");
              })(),
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone,
          },
        });

        const user = await tx.user.create({
          data: {
            email: invite.email,
            password: hashedPassword,
            platformRole: invite.role,
            externalEmployeeId: profile.id,
          },
        });

        await tx.invite.update({
          where: { id: invite.id },
          data: { isUsed: true },
        });

        return { success: true, userId: user.id };
      });
    }),

  /**
   * Стандартный логин. Проверяет статус BANNED для соблюдения политики Soft Delete.
   */
  login: publicProcedure
    .input(z.object({ email: z.email(), password: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({ where: { email: input.email } });

      if (!user || user.status === "BANNED") {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Аккаунт заблокирован или не существует" });
      }

      const isValid = await argon2.verify(user.password, input.password);
      if (!isValid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Неверный пароль" });

      return { success: true, userId: user.id };
    }),
});
