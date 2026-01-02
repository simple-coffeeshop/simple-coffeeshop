import { prisma } from "@simple-coffeeshop/db";
import { beforeAll, describe, expect, it } from "vitest";
import { router } from "../../src/root";
import { createInnerTRPCContext } from "../../src/trpc";

describe("Network Router: Passport & Capabilities", () => {
  let businessId: string;
  let unitId: string;

  beforeAll(async () => {
    const business = await prisma.business.create({ data: { name: "Capability Test" } });
    businessId = business.id;

    // Создание Юнита с ограниченными правами (без KITCHEN)
    const unit = await prisma.unit.create({
      data: {
        name: "Точка без кухни",
        businessId,
        capabilities: ["DATA", "STAFF"],
        allowedIps: ["192.168.1.50"],
        timezone: "Europe/Moscow",
      },
    });
    unitId = unit.id;
  });

  it("должен блокировать доступ к модулю ТТК, если capability KITCHEN отсутствует", async () => {
    const ctx = createInnerTRPCContext({ businessId, unitId });
    const caller = router.createCaller(ctx);

    // Попытка получить рецепты в юните без права "Готовить"
    await expect(caller.network.getUnitRecipes()).rejects.toThrow(
      expect.objectContaining({ code: "FORBIDDEN", message: expect.stringContaining("Capability missing") }),
    );
  });

  it("должен блокировать открытие смены с неразрешенного IP (Geo-fencing)", async () => {
    const ctx = createInnerTRPCContext({
      businessId,
      unitId,
      ip: "10.0.0.1", // Внешний IP, не входящий в allowedIps
    });
    const caller = router.createCaller(ctx);

    await expect(caller.network.openShift()).rejects.toThrow("IP not allowed");
  });
});
