// packages/api/tests/routers/network.test.ts

import { prisma } from "@simple-coffeeshop/db";
import { describe, expect, it } from "vitest";
import { appRouter } from "../../src/root";
import { createInnerTRPCContext } from "../../src/trpc";

describe("Network Router Integration (Real DB)", () => {
  // [EVA_FIX]: Создаем контексты для тестов
  const ctxWithoutBusiness = createInnerTRPCContext({
    userId: "test-user",
    businessId: null, // Здесь намеренно null для проверки Middleware
    platformRole: "NONE",
  });

  it("Должен запрещать создание юнита без businessId в контексте", async () => {
    const caller = appRouter.createCaller(ctxWithoutBusiness);

    await expect(
      caller.network.createUnit({
        name: "Restricted Shop",
        enterpriseId: "some-id",
        capabilities: ["DATA"],
      }),
    ).rejects.toThrow("Business context missing"); // Сообщение из Middleware в trpc.ts
  });

  it("Должен успешно возвращать список юнитов тенанта", async () => {
    const bizId = "test-network-biz";

    // Подготовка базы
    await prisma.business.upsert({
      where: { id: bizId },
      create: { id: bizId, name: "Test Network" },
      update: {},
    });

    const ctx = createInnerTRPCContext({
      userId: "test-user",
      businessId: bizId,
      platformRole: "NONE",
      is2FAVerified: true,
    });

    const caller = appRouter.createCaller(ctx);
    const units = await caller.network.listUnits();

    expect(Array.isArray(units)).toBe(true);
  });
});
