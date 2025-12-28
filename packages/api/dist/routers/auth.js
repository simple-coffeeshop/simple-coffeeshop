// packages/api/src/routers/auth.ts
import { z } from "zod";
import { publicProcedure, router } from "../trpc";
export const authRouter = router({
    // Шаг 1: Запрос ссылки на вход
    requestMagicLink: publicProcedure
        .input(z.object({ email: z.string().email() }))
        .mutation(async ({ input, ctx }) => {
        // Здесь будет логика генерации токена и отправки письма
        // В Спринте 1 мы логируем ссылку в консоль для тестов
        console.log(`[MAGIC LINK] Запрос для: ${input.email}`);
        return { success: true, message: "Если email зарегистрирован, ссылка отправлена" };
    }),
    // Шаг 2: Верификация ссылки
    verify: publicProcedure.input(z.object({ token: z.string() })).mutation(async ({ input }) => {
        // Проверка JWT/Отработанного токена
        return { token: "session_jwt_here" };
    }),
});
