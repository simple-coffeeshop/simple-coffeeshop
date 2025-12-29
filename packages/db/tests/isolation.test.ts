// packages/db/tests/isolation.test.ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createIsolatedClient, prisma } from "../index";

describe("Database Multi-tenancy Isolation", () => {
  const BUSINESS_A = "business_alpha";
  const BUSINESS_B = "business_beta";

  const clientA = createIsolatedClient(BUSINESS_A);
  const clientB = createIsolatedClient(BUSINESS_B);

  beforeAll(async () => {
    await prisma.asset.deleteMany();
    await prisma.unit.deleteMany();
    await prisma.enterprise.deleteMany();
    await prisma.user.deleteMany();
    await prisma.business.deleteMany();

    // Создаем записи через вложенный create (соблюдаем foreign keys)
    await prisma.business.create({
      data: {
        id: BUSINESS_A,
        name: "Alpha Biz",
        owner: { create: { id: "owner_a", email: "owner_a@test.com", business: { connect: { id: BUSINESS_A } } } },
      },
    });

    await prisma.business.create({
      data: {
        id: BUSINESS_B,
        name: "Beta Biz",
        owner: { create: { id: "owner_b", email: "owner_b@test.com", business: { connect: { id: BUSINESS_B } } } },
      },
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
    await prisma.enterprise.create({
      data: { name: "Beta Ent", businessId: BUSINESS_B },
    });

    const resultsA = await clientA.enterprise.findMany();
    expect(resultsA.find((e) => e.businessId === BUSINESS_B)).toBeUndefined();

    // Используем clientB, чтобы Biome не ругался
    const resultsB = await clientB.enterprise.findMany();
    expect(resultsB.some((e) => e.businessId === BUSINESS_B)).toBe(true);
  });
});
