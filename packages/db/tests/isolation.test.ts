/**
 * @file packages/db/tests/isolation.test.ts
 * @description Тесты для проверки Multi-tenancy и корректности рефакторинга (camelCase).
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createIsolatedClient, prisma } from "../index";

describe("Database Multi-tenancy Isolation (Refactored)", () => {
  const BUSINESS_A = "business_alpha";
  const BUSINESS_B = "business_beta";

  const clientA = createIsolatedClient(BUSINESS_A);
  const clientB = createIsolatedClient(BUSINESS_B);

  beforeAll(async () => {
    // Полная очистка перед тестами
    await prisma.asset.deleteMany();
    await prisma.unit.deleteMany();
    await prisma.enterprise.deleteMany();
    await prisma.user.deleteMany();
    await prisma.business.deleteMany();

    await prisma.$transaction(async (tx) => {
      for (const bizId of [BUSINESS_A, BUSINESS_B]) {
        // Проверяем новое поле isArchived (вместо is_archived)
        await tx.business.create({
          data: {
            id: bizId,
            name: bizId === BUSINESS_A ? "Alpha Biz" : "Beta Biz",
            isArchived: false,
          },
        });

        const owner = await tx.user.create({
          data: {
            id: `owner_${bizId}`,
            email: `owner_${bizId}@test.com`,
            businessId: bizId,
            role: "OWNER",
          },
        });

        await tx.business.update({
          where: { id: bizId },
          data: { ownerId: owner.id },
        });
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should auto-inject businessId and handle camelCase fields", async () => {
    // Enterprise: проверяем поле isArchived
    const enterprise = await clientA.enterprise.create({
      data: { name: "Alpha Ent", isArchived: false },
    });
    expect(enterprise.businessId).toBe(BUSINESS_A);
    expect(enterprise.isArchived).toBe(false);

    // Unit: проверяем поля allowedIp и isArchived
    const unit = await clientA.unit.create({
      data: {
        name: "Alpha Shop",
        enterpriseId: enterprise.id,
        allowedIp: "127.0.0.1",
        isArchived: false,
      },
    });
    expect(unit.businessId).toBe(BUSINESS_A);
    expect(unit.allowedIp).toBe("127.0.0.1");
  });

  it("should verify dynamic isolation (without hardcoded model list)", async () => {
    // Asset: должен получить businessId автоматически, так как поле присутствует в модели
    const unit = await prisma.unit.findFirst({ where: { businessId: BUSINESS_A } });
    if (!unit) throw new Error("Seed failed: unit not found");

    const asset = await clientA.asset.create({
      data: {
        name: "Espresso Machine",
        unitId: unit.id,
      },
    });

    expect(asset.businessId).toBe(BUSINESS_A);
  });

  it("should gracefully ignore models without businessId (e.g. Business model)", async () => {
    // Запрос к Business через изолированный клиент не должен падать или фильтроваться по businessId,
    // так как в модели Business нет колонки businessId (она сама является тенантом).
    const businesses = await clientA.business.findMany();
    expect(businesses.length).toBeGreaterThanOrEqual(2);
  });

  it("should strictly filter results by businessId in findMany", async () => {
    const resultsA = await clientA.enterprise.findMany();
    expect(resultsA.every((e) => e.businessId === BUSINESS_A)).toBe(true);

    const resultsB = await clientB.enterprise.findMany();
    expect(resultsB.every((e) => e.businessId === BUSINESS_B)).toBe(true);
  });
});
