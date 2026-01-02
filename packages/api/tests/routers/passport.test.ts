import { prisma } from "@simple-coffeeshop/db";
import { beforeAll, describe, expect, it } from "vitest";
import { router } from "../../src/root";
import { createInnerTRPCContext } from "../../src/trpc";

describe("Network: Passport & Capabilities", () => {
  let businessId: string;
  let unitId: string;

  beforeAll(async () => {
    const business = await prisma.business.create({ data: { name: "Net Test" } });
    businessId = business.id;
    const unit = await prisma.unit.create({
      data: {
        name: "Кофейня на Ленина",
        businessId,
        capabilities: ["STAFF"], // Только штат, без кухни
        allowedIps: ["192.168.1.1"],
        timezone: "Europe/Moscow",
      },
    });
    unitId = unit.id;
  });

  it("должен блокировать доступ к ТТК (KITCHEN), если у Юнита нет этой capability", async () => {
    const ctx = createInnerTRPCContext({ businessId, unitId });
    const caller = router.createCaller(ctx);

    // Пытаемся вызвать метод Модуля 2 (допустим, получение рецептов)
    await expect(caller.network.getUnitRecipes()).rejects.toThrow(expect.objectContaining({ code: "FORBIDDEN" }));
  });

  it("должен блокировать старт смены при несовпадении IP (Geofencing)", async () => {
    const ctx = createInnerTRPCContext({
      businessId,
      unitId,
      ip: "10.0.0.1", // Чужой IP
    });
    const caller = router.createCaller(ctx);

    await expect(caller.network.openShift()).rejects.toThrow(
      expect.objectContaining({ message: expect.stringContaining("IP restricted") }),
    );
  });
});
