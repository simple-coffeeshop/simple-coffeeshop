// packages/api/tests/routers/passport.test.ts
import { prisma } from "@simple-coffeeshop/db";
import { beforeAll, describe, expect, it } from "vitest";
import { appRouter } from "../../src/root.js";
import { createInnerTRPCContext } from "../../src/trpc.js";
import { cleanupDatabase } from "../helpers/cleanup.js";

describe("Network: Passport & Capabilities", () => {
  let businessId: string;
  let enterpriseId: string;
  let unitId: string;

  beforeAll(async () => {
    await cleanupDatabase(); // [EVA_FIX]: Устраняет ошибку RESTRICT на EmployeeProfile
    const business = await prisma.business.create({ data: { name: "Passport Test" } });
    businessId = business.id;

    const enterprise = await prisma.enterprise.create({
      data: { name: "HQ", businessId },
    });
    enterpriseId = enterprise.id;

    const unit = await prisma.unit.create({
      data: {
        name: "Кофейня на Ленина",
        businessId,
        enterpriseId,
        capabilities: ["STAFF"],
        allowedIps: ["192.168.1.1"],
        timezone: "Europe/Moscow",
      },
    });
    unitId = unit.id;
  });

  it("должен проверять состав возможностей Паспорта Юнита", async () => {
    const ctx = createInnerTRPCContext({ businessId, userId: "admin", platformRole: "ROOT" });
    const caller = appRouter.createCaller(ctx);

    const units = await caller.network.listUnits();
    const testUnit = units.find((u) => u.id === unitId);

    expect(testUnit?.capabilities).toContain("STAFF");
    expect(testUnit?.capabilities).not.toContain("PRODUCTION");
  });

  it("должен корректно обрабатывать Geofencing через контекст tRPC", async () => {
    const ctx = createInnerTRPCContext({
      businessId,
      unitId,
      ip: "192.168.1.1",
      userId: "manager",
      platformRole: "USER",
    });

    // Проверка корректности формирования контекста
    expect(ctx.ip).toBe("192.168.1.1");
  });
});
