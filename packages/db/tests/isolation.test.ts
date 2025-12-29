// packages/db/tests/isolation.test.ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createIsolatedClient, prisma } from "../index";

describe("Database Multi-tenancy Isolation", () => {
  const BUSINESS_A = "business_alpha";
  const BUSINESS_B = "business_beta";
  const clientA = createIsolatedClient(BUSINESS_A);

  beforeAll(async () => {
    // Чистим всё
    await prisma.user.deleteMany();
    await prisma.business.deleteMany();

    // 1. Создаем бизнес и первого пользователя (члена бизнеса)
    // Благодаря связи 'users', Prisma автоматически проставит businessId пользователю
    await prisma.business.create({
      data: {
        id: BUSINESS_A,
        name: "Alpha Biz",
        users: {
          create: {
            id: "owner_a",
            email: "owner_a@test.com",
          },
        },
      },
    });

    // 2. Делаем этого пользователя владельцем (согласно твоей логике первого входа)
    await prisma.business.update({
      where: { id: BUSINESS_A },
      data: { ownerId: "owner_a" },
    });

    // Повторяем для Бизнеса Б
    await prisma.business.create({
      data: {
        id: BUSINESS_B,
        name: "Beta Biz",
        users: {
          create: { id: "owner_b", email: "owner_b@test.com" },
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should auto-inject businessId on create", async () => {
    // @ts-expect-error - businessId инжектится расширением
    const enterprise = await clientA.enterprise.create({
      data: { name: "Alpha Ent" },
    });
    expect(enterprise.businessId).toBe(BUSINESS_A);
  });

  // ... остальное без изменений
});
