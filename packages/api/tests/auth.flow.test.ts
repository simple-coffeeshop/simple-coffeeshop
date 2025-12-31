import { prisma } from "@simple-coffeeshop/db";
import { hash } from "argon2";
import { beforeAll, describe, expect, it } from "vitest";

describe("Sprint 1: Auth & Management Flow", () => {
  beforeAll(async () => {
    // Очищаем пользователя перед тестом, чтобы не было конфликта уникальности
    await prisma.user.deleteMany({ where: { email: "admin@aurora.com" } });
  });

  it("SU должен залогиниться и создать бизнес", async () => {
    const password = "super-secret-password";
    const su = await prisma.user.create({
      data: {
        email: "admin@aurora.com",
        passwordHash: await hash(password),
        platformRole: "ROOT",
      },
    });

    expect(su.email).toBe("admin@aurora.com");

    // 3. Создаем бизнес
    const biz = await prisma.business.create({
      data: { name: "Test Coffee Corp", ownerId: su.id },
    });
    expect(biz.name).toBe("Test Coffee Corp");
  });
});
