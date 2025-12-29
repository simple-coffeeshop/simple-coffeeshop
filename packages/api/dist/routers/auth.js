// packages/api/src/routers/auth.ts
import { z } from "zod";
import { publicProcedure, router } from "../trpc";
export const authRouter = router({
    requestMagicLink: publicProcedure.input(z.object({ email: z.email() })).mutation(async ({ input, ctx }) => {
        const email = input.email.toLowerCase();
        // [EVAS_SYNC]: Используем глобальный prisma, так как мы еще не знаем businessId
        const user = await ctx.prisma.user.findFirst({
            where: { email },
        });
        if (!user) {
            // Для безопасности возвращаем успех, даже если пользователя нет
            console.warn(`[AUTH]: Попытка входа для несуществующего email: ${email}`);
            return { success: true };
        }
        console.log(`[MAGIC LINK]: Ссылка генерируется для ${user.email} (Business: ${user.businessId})`);
        return { success: true };
    }),
    verify: publicProcedure.input(z.object({ token: z.string() })).mutation(async () => {
        return {
            token: "session_jwt_mock",
            businessId: "mock_business_id_from_token",
        };
    }),
});
