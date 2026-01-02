// packages/api/tests/routers/network.test.ts
import { prisma } from "@simple-coffeeshop/db";
import { beforeAll, describe, expect, it } from "vitest";
import { appRouter } from "../../src/root.js"; // [EVA_FIX]: Импорт appRouter
import { createInnerTRPCContext } from "../../src/trpc.js";
import { cleanupDatabase } from "../helpers/cleanup.js";

describe("Network Router: Passport & Capabilities", () => {
  let businessId: string;
  let unitId: string;

  beforeAll(async () => {
    await cleanupDatabase(); // [EVA_FIX]: Устраняет ошибку RESTRICT на EmployeeProfile
    const business = await prisma.business.create({ data: { name: "Capability Test" } });
    businessId = business.id;

    // [EVA_FIX]: Согласно network.prisma, Unit требует enterpriseId
    const enterprise = await prisma.enterprise.create({
      data: { name: "Test Enterprise", businessId },
    });

    // Создание Юнита с актуальными именами Capabilities
    const unit = await prisma.unit.create({
      data: {
        name: "Точка без кухни",
        businessId,
        enterpriseId: enterprise.id,
        capabilities: ["INVENTORY", "STAFF"], // DATA -> INVENTORY, KITCHEN отсутствует
        allowedIps: ["192.168.1.50"],
        timezone: "Europe/Moscow",
      },
    });
    unitId = unit.id;
  });

  it("должен блокировать доступ к модулю ТТК, если capability PRODUCTION отсутствует", async () => {
    const ctx = createInnerTRPCContext({ businessId, unitId, userId: "test-user", platformRole: "USER" });
    const caller = appRouter.createCaller(ctx);

    // [EVA_FIX]: Ожидаем FORBIDDEN при отсутствии PRODUCTION (ранее KITCHEN)
    await expect(caller.network.getUnitRecipes()).rejects.toThrow(
      expect.objectContaining({ code: "FORBIDDEN", message: expect.stringContaining("Capability missing") }),
    );
  });

  it("должен блокировать открытие смены с неразрешенного IP (Geo-fencing)", async () => {
    const ctx = createInnerTRPCContext({
      businessId,
      unitId,
      userId: "test-user",
      platformRole: "USER",
      ip: "10.0.0.1", // Внешний IP
    });
    const caller = appRouter.createCaller(ctx);

    // Синхронизация с текстом ошибки в network.ts
    await expect(caller.network.openShift()).rejects.toThrow(/IP not allowed|IP restricted/i);
  });
});
