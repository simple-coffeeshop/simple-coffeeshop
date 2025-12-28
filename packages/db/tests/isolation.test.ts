// packages/db/tests/isolation.test.ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createIsolatedClient, prisma } from "../index";

describe("Database Multi-tenancy Isolation", () => {
  const BUSINESS_A = "business_alpha";
  const BUSINESS_B = "business_beta";

  const clientA = createIsolatedClient(BUSINESS_A);
  const clientB = createIsolatedClient(BUSINESS_B);

  beforeAll(async () => {
    // Очистка в правильном порядке
    await prisma.unit.deleteMany();
    await prisma.enterprise.deleteMany();
    await prisma.user.deleteMany();
    await prisma.business.deleteMany();

    // Создаем корневые записи бизнесов
    await prisma.business.createMany({
      data: [
        { id: BUSINESS_A, name: "Alpha Biz", ownerId: "owner_a" },
        { id: BUSINESS_B, name: "Beta Biz", ownerId: "owner_b" },
      ],
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should auto-inject businessId on create", async () => {
    const enterprise = await clientA.enterprise.create({
      data: { name: "Alpha Ent" },
    });

    expect(enterprise.businessId).toBe(BUSINESS_A);

    const unit = await clientA.unit.create({
      data: {
        name: "Alpha Shop",
        enterpriseId: enterprise.id,
        capabilities: ["💰"],
      },
    });

    expect(unit.businessId).toBe(BUSINESS_A);
  });

  it("should filter results by businessId", async () => {
    const entB = await prisma.enterprise.create({
      data: { name: "Beta Ent", businessId: BUSINESS_B },
    });

    const resultsA = await clientA.enterprise.findMany();
    expect(resultsA).toHaveLength(1);
    expect(resultsA.find((e) => e.id === entB.id)).toBeUndefined();

    const resultsB = await clientB.enterprise.findMany();
    expect(resultsB).toHaveLength(1);
    expect(resultsB[0].id).toBe(entB.id);
  });
});
