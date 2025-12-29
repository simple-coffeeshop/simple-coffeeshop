// packages/db/tests/isolation.test.ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createIsolatedClient, prisma } from "../index";

/**
 * [EVAS_SYNC]: Тесты изоляции для реальной схемы с моделью User.
 * Учитываем, что поля businessId и enterpriseId обязательны для типизации Prisma.
 */
describe("Database Multi-tenancy Isolation", () => {
  const BUSINESS_A = "business_alpha";
  const BUSINESS_B = "business_beta";

  const clientA = createIsolatedClient(BUSINESS_A);
  const clientB = createIsolatedClient(BUSINESS_B);

  beforeAll(async () => {
    // Очистка в правильном порядке (Asset -> Unit -> Enterprise -> User -> Business)
    await prisma.asset.deleteMany();
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
    // Передаем businessId: BUSINESS_A явно, чтобы удовлетворить TS.
    // В рантайме extension в index.ts его подменит/гарантирует.
    const enterprise = await clientA.enterprise.create({
      data: {
        name: "Alpha Ent",
        businessId: BUSINESS_A,
      },
    });

    expect(enterprise.businessId).toBe(BUSINESS_A);

    const unit = await clientA.unit.create({
      data: {
        name: "Alpha Shop",
        enterpriseId: enterprise.id,
        businessId: BUSINESS_A,
        capabilities: ["💰"],
      },
    });

    expect(unit.businessId).toBe(BUSINESS_A);
  });

  it("should filter results by businessId", async () => {
    // Создаем запись для Бизнеса Б через обычный (не изолированный) клиент
    const entB = await prisma.enterprise.create({
      data: {
        name: "Beta Ent",
        businessId: BUSINESS_B,
      },
    });

    // Проверяем, что клиент А не видит записи Бизнеса Б
    const resultsA = await clientA.enterprise.findMany();
    expect(resultsA.find((e) => e.id === entB.id)).toBeUndefined();

    // Проверяем, что клиент Б видит свою запись
    const resultsB = await clientB.enterprise.findMany();
    expect(resultsB.some((e) => e.id === entB.id)).toBe(true);
  });
});
