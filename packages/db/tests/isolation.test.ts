// packages/db/tests/isolation.test.ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createIsolatedClient, prisma } from "../index";

describe("Database Multi-tenancy Isolation", () => {
  const BUSINESS_A = "business_alpha";
  const BUSINESS_B = "business_beta";

  // Создаем изолированные клиенты
  const clientA = createIsolatedClient(BUSINESS_A);
  const clientB = createIsolatedClient(BUSINESS_B);

  beforeAll(async () => {
    // [CRITICAL]: Очистка базы перед интеграционными тестами
    await prisma.unit.deleteMany();
    await prisma.enterprise.deleteMany();
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

  it("should filter results by businessId in findMany", async () => {
    // Создаем данные для бизнеса Б через системный клиент
    const entB = await prisma.enterprise.create({
      data: { name: "Beta Ent", businessId: BUSINESS_B },
    });

    // 1. Проверяем Клиента А: он НЕ должен видеть данные Бизнеса Б
    const resultsA = await clientA.enterprise.findMany();
    expect(resultsA).toHaveLength(1);
    expect(resultsA.find((e) => e.id === entB.id)).toBeUndefined();

    // 2. Проверяем Клиента Б: он ДОЛЖЕН видеть свое предприятие
    const resultsB = await clientB.enterprise.findMany();
    expect(resultsB).toHaveLength(1);
    expect(resultsB[0].id).toBe(entB.id);

    // 3. Системный клиент должен видеть всё
    const allResults = await prisma.enterprise.findMany();
    expect(allResults.length).toBeGreaterThanOrEqual(2);
  });

  it("should prevent unauthorized updates (Isolation Shield)", async () => {
    // Ищем предприятие Бизнеса Б
    const entB = await prisma.enterprise.findFirst({
      where: { businessId: BUSINESS_B },
    });

    if (!entB) throw new Error("Seed data for Business B missing");

    // Пытаемся обновить его через клиент А
    // [EVAS_PROTIP]: Фильтр { id: entB.id, businessId: BUSINESS_A } вернет 0,
    // так как запись с таким ID принадлежит другому бизнесу.
    const result = await clientA.enterprise.updateMany({
      where: { id: entB.id },
      data: { name: "HACKED" },
    });

    expect(result.count).toBe(0);

    // Убеждаемся, что данные в базе не изменились
    const checkEntB = await prisma.enterprise.findUnique({
      where: { id: entB.id },
    });
    expect(checkEntB?.name).toBe("Beta Ent");
  });
});
