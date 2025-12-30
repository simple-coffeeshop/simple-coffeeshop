// packages/db/tests/isolation.test.ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createIsolatedClient, prisma } from "../index";

describe("Real DB Isolation Test", () => {
  const BIZ_A = "tenant_a";
  const BIZ_B = "tenant_b";

  beforeAll(async () => {
    // [FIX]: Очистка всех таблиц с игнорированием зависимостей через CASCADE
    const tables = [
      "Asset",
      "PermissionOverride",
      "UserCustomRole",
      "CustomRole",
      "Handshake",
      "Unit",
      "Enterprise",
      "Session",
      "Member",
      "User",
      "Business",
    ];

    for (const table of tables) {
      // Используем $executeRawUnsafe для быстрой и полной очистки
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`);
    }

    // Семплирование базовых тенантов
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

  it("Обычный клиент видит только свои данные и автоматически инжектит ID", async () => {
    const clientA = createIsolatedClient(BIZ_A, "NONE");

    const ent = await prisma.enterprise.create({
      data: { name: "Alpha Ent", businessId: BIZ_A },
    });

    // [FIX]: Используем 'as any' для теста автоматической инъекции businessId рантаймом
    const unit = await clientA.unit.create({
      data: {
        name: "Shop A",
        enterpriseId: ent.id,
      } as never,
    });

    expect(unit.businessId).toBe(BIZ_A);

    const allUnits = await clientA.unit.findMany();
    // Проверяем, что фильтрация работает физически
    expect(allUnits.length).toBeGreaterThan(0);
    expect(allUnits.every((u) => u.businessId === BIZ_A)).toBe(true);
  });

  it("ROOT обходит изоляцию (God-mode)", async () => {
    const rootClient = createIsolatedClient(null, "ROOT");
    // ROOT должен видеть все записи в базе
    const count = await rootClient.unit.count();
    expect(count).toBeGreaterThan(0);
  });

  it("Запрет на доступ к данным без businessId для обычного юзера", async () => {
    // Теперь создание клиента не должно выбрасывать ошибку сразу
    const clientEmpty = createIsolatedClient(null, "NONE");

    // Ошибка должна возникнуть именно при попытке запроса к изолированной модели
    await expect(clientEmpty.unit.findMany()).rejects.toThrow("UNAUTHORIZED: Business ID is required");
  });

  it("should automatically filter out archived records (Soft Delete)", async () => {
    const BIZ_ID = "soft_delete_test";
    const client = createIsolatedClient(BIZ_ID, "NONE");

    // Подготовка: создаем бизнес и предприятие
    await prisma.business.create({ data: { id: BIZ_ID, name: "Soft Delete Test" } });
    const ent = await prisma.enterprise.create({
      data: { name: "Test Ent", businessId: BIZ_ID },
    });

    // Создаем два юнита: один активный, один архивный
    await prisma.unit.createMany({
      data: [
        { name: "Active Unit", businessId: BIZ_ID, enterpriseId: ent.id, isArchived: false },
        { name: "Archived Unit", businessId: BIZ_ID, enterpriseId: ent.id, isArchived: true },
      ],
    });

    // 1. Проверяем, что изолированный клиент видит только активный юнит
    const visibleUnits = await client.unit.findMany();
    expect(visibleUnits).toHaveLength(1);
    expect(visibleUnits[0].name).toBe("Active Unit");

    // 2. Проверяем, что ROOT по-прежнему видит всё (включая архив)
    const rootClient = createIsolatedClient(null, "ROOT");
    const allUnits = await rootClient.unit.findMany({ where: { businessId: BIZ_ID } });
    expect(allUnits).toHaveLength(2);
  });
});
