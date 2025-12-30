// packages/api/tests/routers/network.test.ts

import { prisma } from "@simple-coffeeshop/db";
import { describe, expect, it } from "vitest";
import { appRouter } from "../../src/root";
import { createInnerTRPCContext } from "../../src/trpc";

describe("Network Router Integration (Real DB)", () => {
  it("Должен запрещать создание юнита без businessId в контексте", async () => {
    const ctx = createInnerTRPCContext({
      userId: "test-user",
      businessId: null, // Имитируем ROOT, который еще не выбрал тенант
      platformRole: "NONE",
      is2FAVerified: true,
    });

    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.network.createUnit({
        name: "Restricted Shop",
        enterpriseId: "any",
        timezone: "UTC",
        capabilities: ["DATA"],
      }),
    ).rejects.toThrow("Необходимо выбрать бизнес");
  });

  it("Должен успешно возвращать список юнитов тенанта", async () => {
    const bizId = "test-network-biz";
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
