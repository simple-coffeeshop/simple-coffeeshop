import { prisma } from "@simple-coffeeshop/db";
import { type inferRouterInputs, TRPCError } from "@trpc/server";
import { beforeAll, describe, expect, it } from "vitest";
import { router } from "../../src/root";
import { createInnerTRPCContext } from "../../src/trpc";

type RouterInput = inferRouterInputs<typeof router>;

describe("Auth: Onboarding & Hard Link", () => {
  let businessId: string;

  beforeAll(async () => {
    const business = await prisma.business.create({
      data: { name: "Test Onboarding Corp" },
    });
    businessId = business.id;
  });

  it("должен отклонить регистрацию без валидного инвайта", async () => {
    const ctx = createInnerTRPCContext({ businessId });
    const caller = router.createCaller(ctx);

    const input: RouterInput["auth"]["completeRegistration"] = {
      token: "invalid-token",
      password: "StrongPassword123!",
      firstName: "Eva",
      lastName: "AI",
      phone: "+79991234567",
    };

    await expect(caller.auth.completeRegistration(input)).rejects.toThrow(
      expect.objectContaining({ code: "NOT_FOUND" }),
    );
  });

  it("должен создать атомарную связку User <-> EmployeeProfile через инвайт", async () => {
    // 1. Создаем инвайт вручную (имитация действия админа)
    const invite = await prisma.invite.create({
      data: {
        email: "new-employee@test.com",
        token: "magic-token-123",
        role: "NONE",
        businessId,
        expiresAt: new Date(Date.now() + 3600000), // +1 час
      },
    });

    const ctx = createInnerTRPCContext({ businessId });
    const caller = router.createCaller(ctx);

    const input: RouterInput["auth"]["completeRegistration"] = {
      token: invite.token,
      password: "SecurePass123!",
      firstName: "Алексей",
      lastName: "Петров",
      phone: "+79001112233",
    };

    const result = await caller.auth.completeRegistration(input);

    // 2. Проверка Hard Link
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: result.userId },
      include: { employeeProfile: true }, // Ожидаем relation из Blueprint
    });

    const profile = await prisma.employeeProfile.findFirstOrThrow({
      where: { businessId },
    });

    expect(user.externalEmployeeId).toBe(profile.id); // Immutable ID check
    expect(user.status).toBe("ACTIVE");

    // 3. Проверка жизненного цикла инвайта
    const updatedInvite = await prisma.invite.findUnique({ where: { id: invite.id } });
    expect(updatedInvite?.isUsed).toBe(true);
  });
});
