// packages/api/tests/routers/onboarding.test.ts
import { prisma } from "@simple-coffeeshop/db";
import type { inferRouterInputs } from "@trpc/server";
import { beforeAll, describe, expect, it } from "vitest";
import { appRouter } from "../../src/root.js";
import { createInnerTRPCContext } from "../../src/trpc.js";
import { cleanupDatabase } from "../helpers/cleanup.js";

type RouterInput = inferRouterInputs<typeof appRouter>;

describe("Auth: Onboarding & Hard Link", () => {
  let businessId: string;

  beforeAll(async () => {
    // Очистка перед тестом
    await cleanupDatabase(); // [EVA_FIX]: Устраняет ошибку RESTRICT на EmployeeProfile

    const business = await prisma.business.create({
      data: { name: "Test Onboarding Corp" },
    });
    businessId = business.id;
  });

  it("должен отклонить регистрацию без валидного инвайта", async () => {
    const ctx = createInnerTRPCContext({ businessId });
    const caller = appRouter.createCaller(ctx);

    const input: RouterInput["auth"]["completeRegistration"] = {
      token: "invalid-token",
      password: "StrongPassword123!",
      firstName: "Eva",
      lastName: "AI",
      phone: "+79991234567",
    };

    // [EVA_FIX]: В роутере выбрасывается UNAUTHORIZED при отсутствии инвайта
    await expect(caller.auth.completeRegistration(input)).rejects.toThrow(
      expect.objectContaining({ code: "UNAUTHORIZED" }),
    );
  });

  it("должен создать атомарную связку User <-> EmployeeProfile через инвайт", async () => {
    const invite = await prisma.invite.create({
      data: {
        email: "new-employee@test.com",
        token: `magic-token-${Math.random().toString(36).substring(7)}`,
        role: "NONE", // PlatformRole
        businessId,
        expiresAt: new Date(Date.now() + 3600000),
        invitedById: "admin-id",
      },
    });

    const ctx = createInnerTRPCContext({ businessId });
    const caller = appRouter.createCaller(ctx);

    const input: RouterInput["auth"]["completeRegistration"] = {
      token: invite.token,
      password: "SecurePass123!",
      firstName: "Алексей",
      lastName: "Петров",
      phone: `+7900${Math.floor(Math.random() * 10000000)}`,
    };

    const result = await caller.auth.completeRegistration(input);

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: result.userId },
      include: { employeeProfile: true },
    });

    expect(user.externalEmployeeId).toBe(user.employeeProfile?.id);
    expect(user.status).toBe("ACTIVE");

    const updatedInvite = await prisma.invite.findUnique({ where: { id: invite.id } });
    expect(updatedInvite?.isUsed).toBe(true);
  });
});
