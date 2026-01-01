// packages/db/tests/isolation.test.ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createIsolatedClient, prisma } from "../index";

describe("Real DB Isolation Test", () => {
  const BIZ_A = "tenant_a";
  const BIZ_B = "tenant_b";

  beforeAll(async () => {
    /**
     * [EVA_FIX]: Очистка таблиц в строгом порядке.
     * Используем TRUNCATE CASCADE для сброса всех зависимых данных.
     */
    const tables = ["Asset", "Handshake", "Unit", "Enterprise", "User", "Business"];

    for (const table of tables) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`);
    }

    await prisma.business.createMany({
      data: [
        { id: BIZ_A, name: "Biz A" },
        { id: BIZ_B, name: "Biz B" },
      ],
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("Обычный клиент видит только свои данные и автоматически инжектит ID при создании", async () => {
    const clientA = createIsolatedClient(BIZ_A, "NONE");

    const ent = await prisma.enterprise.create({
      data: { name: "Alpha Ent", businessId: BIZ_A },
    });

    /**
     * [EVA_FIX]: Решение ошибки ts(2322).
     * Мы используем двойное приведение (as unknown as ...), чтобы убедить TS,
     * что объект 'data' содержит businessId. В реальности его добавит рантайм-прокси.
     * Это позволяет избежать 'any' и сохранить строгость типов в остальной части теста.
     */
    const unit = await clientA.unit.create({
      data: {
        name: "Shop A",
        enterpriseId: ent.id,
      } as unknown as { businessId: string; name: string; enterpriseId: string },
    });

    expect(unit.businessId).toBe(BIZ_A);

    const allUnits = await clientA.unit.findMany();
    expect(allUnits.length).toBeGreaterThan(0);
    expect(allUnits.every((u) => u.businessId === BIZ_A)).toBe(true);
  });

  it("ROOT обходит изоляцию (God-mode Access)", async () => {
    const rootClient = createIsolatedClient(null, "ROOT");
    const count = await rootClient.unit.count();
    expect(count).toBeGreaterThan(0);
  });

  it("Запрет на доступ к данным без businessId (Lazy Validation)", async () => {
    const clientEmpty = createIsolatedClient(null, "NONE");

    await expect(clientEmpty.unit.findMany()).rejects.toThrow(
      "UNAUTHORIZED: Business ID is required for isolation-enabled models",
    );
  });

  it("Автоматическая фильтрация архивных записей (Soft Delete)", async () => {
    const BIZ_ID = "soft_delete_test";
    const client = createIsolatedClient(BIZ_ID, "NONE");

    await prisma.business.create({ data: { id: BIZ_ID, name: "Soft Delete Test" } });
    const ent = await prisma.enterprise.create({
      data: { name: "Test Ent", businessId: BIZ_ID },
    });

    await prisma.unit.createMany({
      data: [
        { name: "Active Unit", businessId: BIZ_ID, enterpriseId: ent.id, isArchived: false },
        { name: "Archived Unit", businessId: BIZ_ID, enterpriseId: ent.id, isArchived: true },
      ],
    });

    const visibleUnits = await client.unit.findMany();
    expect(visibleUnits).toHaveLength(1);
    expect(visibleUnits[0].name).toBe("Active Unit");

    const rootClient = createIsolatedClient(null, "ROOT");
    const allUnits = await rootClient.unit.findMany({ where: { businessId: BIZ_ID } });
    expect(allUnits).toHaveLength(2);
  });
});
