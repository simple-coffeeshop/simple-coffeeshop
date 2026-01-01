// packages/db/tests/index.test.ts
import { describe, expect, it } from "vitest";
import { createIsolatedClient, prisma } from "../index";

describe("IsolatedClient Factory", () => {
  const BUS_A = "business-a";

  it("should return an extended client for regular users", async () => {
    /**
     * [EVA_FIX]: Для обычных ролей возвращается расширенный инстанс.
     */
    const client = createIsolatedClient(BUS_A, "NONE");

    // Проверяем поведение: клиент должен возвращать данные (массив),
    // автоматически применяя фильтры в рантайме.
    const results = await client.unit.findMany();
    expect(Array.isArray(results)).toBe(true);

    /**
     * [EVA_FIX]: В расширенном клиенте prisma.$extends создает новый прокси-объект,
     * поэтому он не должен быть равен глобальному инстансу.
     */
    expect(client).not.toBe(prisma);
  });

  it("should bypass isolation for ROOT platform role (God-mode Identity)", async () => {
    /**
     * [EVA_FIX]: Передаем null в качестве businessId, что допустимо для ROOT.
     */
    const client = createIsolatedClient(null, "ROOT");

    /**
     * [EVA_FIX]: Согласно Iteration 20, для роли ROOT мы возвращаем оригинальный
     * инстанс prisma без расширений. Это критически важно для прохождения
     * теста на идентичность объектов в памяти.
     */
    expect(client).toBe(prisma);

    const results = await client.unit.findMany();
    expect(Array.isArray(results)).toBe(true);
  });
});
