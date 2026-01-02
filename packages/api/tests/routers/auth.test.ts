import { prisma } from "@simple-coffeeshop/db";
import type { inferRouterInputs } from "@trpc/server";
import { beforeAll, describe, expect, it } from "vitest";
import { router } from "../../src/root";
import { createInnerTRPCContext } from "../../src/trpc";

type RouterInput = inferRouterInputs<typeof router>;

describe("Auth Router: Onboarding & Hard Link", () => {
  let businessId: string;

  beforeAll(async () => {
    // Подготовка среды: создание бизнеса
    const business = await prisma.business.create({
      data: { name: "Test Coffee Corp" },
    });
    businessId = business.id;
  });

  it("должен атомарно создать User и EmployeeProfile через Magic Link", async () => {
    // 1. Инициация инвайта админом
    const invite = await prisma.invite.create({
      data: {
        email: "barista@test.com",
        token: "magic-token-xyz",
        role: "NONE",
        businessId,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60), // +1 час
      },
    });

    const ctx = createInnerTRPCContext({ businessId });
    const caller = router.createCaller(ctx);

    const registrationInput: RouterInput["auth"]["completeRegistration"] = {
      token: invite.token,
      password: "SecurePassword123!",
      firstName: "Иван",
      lastName: "Иванов",
      phone: "+79001112233",
    };

    const result = await caller.auth.completeRegistration(registrationInput);

    // 2. Проверка Hard Link (неразрывная связь по ID)
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: result.userId },
      include: { employeeProfile: true },
    });

    expect(user.externalEmployeeId).toBe(user.employeeProfile?.id);
    expect(user.status).toBe("ACTIVE");

    // 3. Проверка жизненного цикла инвайта (авто-удаление/использование)
    const usedInvite = await prisma.invite.findUnique({ where: { id: invite.id } });
    expect(usedInvite?.isUsed).toBe(true);
  });

  it("должен запретить вход заблокированному (BANNED) пользователю, сохраняя профиль", async () => {
    // Имитация увольнения: статус BANNED
    const user = await prisma.user.findFirstOrThrow({ where: { email: "barista@test.com" } });
    await prisma.user.update({
      where: { id: user.id },
      data: { status: "BANNED" },
    });

    const ctx = createInnerTRPCContext({ businessId });
    const caller = router.createCaller(ctx);

    // Проверка логина
    await expect(
      caller.auth.login({
        email: "barista@test.com",
        password: "SecurePassword123!",
      }),
    ).rejects.toThrow("Account is blocked");

    // Проверка вечности истории: профиль сотрудника все еще существует в базе
    const profileExists = await prisma.employeeProfile.findUnique({
      where: { id: user.externalEmployeeId ?? "" },
    });
    expect(profileExists).not.toBeNull();
  });
});
