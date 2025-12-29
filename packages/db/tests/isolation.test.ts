// packages/db/tests/isolation.test.ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createIsolatedClient, prisma } from "../index";

describe("Database Multi-tenancy Isolation", () => {
  const BUSINESS_A = "business_alpha";
  const BUSINESS_B = "business_beta";

  const clientA = createIsolatedClient(BUSINESS_A);
  const clientB = createIsolatedClient(BUSINESS_B);

  beforeAll(async () => {
    // [CRITICAL] Очистка в порядке, обратном зависимостям
    await prisma.asset.deleteMany();
    await prisma.unit.deleteMany();
    await prisma.enterprise.deleteMany();
    await prisma.user.deleteMany();
    await prisma.business.deleteMany();

    // Создаем два изолированных бизнеса через транзакцию
    await prisma.$transaction(async (tx) => {
      for (const bizId of [BUSINESS_A, BUSINESS_B]) {
        // 1. Создаем бизнес (теперь ownerId опционален в схеме)
        await tx.business.create({
          data: {
            id: bizId,
            name: bizId === BUSINESS_A ? "Alpha Biz" : "Beta Biz",
          },
        });

        // 2. Создаем владельца (Member relation через businessId)
        const owner = await tx.user.create({
          data: {
            id: `owner_${bizId}`,
            email: `owner_${bizId}@test.com`,
            businessId: bizId,
            role: "OWNER",
          },
        });

        // 3. Устанавливаем связь владельца (Owner relation через ownerId)
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

  it("should auto-inject businessId on create", async () => {
    const enterprise = await clientA.enterprise.create({
      data: { name: "Alpha Ent" },
    });
    expect(enterprise.businessId).toBe(BUSINESS_A);

    const unit = await clientA.unit.create({
      data: {
        name: "Alpha Shop",
        enterpriseId: enterprise.id,
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

    const resultsB = await clientB.enterprise.findMany();
    expect(resultsB.some((e) => e.businessId === BUSINESS_B)).toBe(true);
  });
});
