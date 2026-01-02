// packages/api/tests/routers/auth.test.ts
import { prisma } from "@simple-coffeeshop/db";
import type { inferRouterInputs } from "@trpc/server";
import { beforeAll, describe, expect, it } from "vitest";
import { appRouter } from "../../src/root.js"; // Используем актуальный роутер
import { createInnerTRPCContext } from "../../src/trpc.js";
import { cleanupDatabase } from "../helpers/cleanup.js";

type RouterInput = inferRouterInputs<typeof appRouter>;

describe("Auth Router: Onboarding & Hard Link", () => {
  let businessId: string;

  beforeAll(async () => {
    await cleanupDatabase(); // [EVA_FIX]: Устраняет ошибку RESTRICT на EmployeeProfile

    const business = await prisma.business.create({
      data: { name: "Test Coffee Corp" },
    });
    businessId = business.id;
  });

  it("должен атомарно создать User и EmployeeProfile через Magic Link", async () => {
    const invite = await prisma.invite.create({
      data: {
        email: "barista@test.com",
        token: `magic-token-${Math.random().toString(36).substring(7)}`, // Уникальный токен
        role: "NONE", // Используем корректный PlatformRole
        businessId,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        invitedById: "test-admin-id", // Обязательное поле
      },
    });

    const ctx = createInnerTRPCContext({ businessId });
    const caller = appRouter.createCaller(ctx);

    const registrationInput: RouterInput["auth"]["completeRegistration"] = {
      token: invite.token,
      password: "SecurePassword123!",
      firstName: "Иван",
      lastName: "Иванов",
      phone: `+790011122${Math.floor(Math.random() * 99)}`, // Уникальный телефон
    };

    const result = await caller.auth.completeRegistration(registrationInput);
    expect(result.userId).toBeDefined();

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: result.userId },
      include: { employeeProfile: true },
    });

    expect(user.externalEmployeeId).toBe(user.employeeProfile?.id); // Проверка Hard Link
    expect(user.status).toBe("ACTIVE");
  });

  it("должен запретить вход заблокированному (BANNED) пользователю", async () => {
    const user = await prisma.user.findFirstOrThrow({ where: { email: "barista@test.com" } });
    await prisma.user.update({
      where: { id: user.id },
      data: { status: "BANNED" },
    });

    const ctx = createInnerTRPCContext({ businessId });
    const caller = appRouter.createCaller(ctx);

    // Синхронизация текста ошибки с auth.ts
    await expect(
      caller.auth.login({
        email: "barista@test.com",
        password: "SecurePassword123!",
      }),
    ).rejects.toThrow("Аккаунт заблокирован или не существует");
  });
});
