// packages/db/tests/index.test.ts
import { describe, expect, it } from "vitest";
import { createIsolatedClient, prisma } from "../index";

describe("IsolatedClient Factory", () => {
  const BUS_A = "business-a";

  it("should return an extended client for regular users", async () => {
    const client = createIsolatedClient(BUS_A, "NONE");

    // Проверяем поведение: клиент должен возвращать данные,
    // даже если мы не передаем фильтр вручную
    const results = await client.unit.findMany();
    expect(Array.isArray(results)).toBe(true);

    // В расширенном клиенте prisma.$extends создает прокси-объект,
    // поэтому он не равен глобальному инстансу
    expect(client).not.toBe(prisma);
  });

  it("should bypass isolation for ROOT platform role", async () => {
    const client = createIsolatedClient(null, "ROOT");

    // Логика God-mode: ROOT получает прямой доступ к глобальному клиенту
    expect(client).toBe(prisma);

    const results = await client.unit.findMany();
    expect(Array.isArray(results)).toBe(true);
  });
});
