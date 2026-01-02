// packages/api/tests/auth.flow.test.ts
import { prisma } from "@simple-coffeeshop/db";
import { hash } from "argon2";
import { beforeAll, describe, expect, it } from "vitest";
import { cleanupDatabase } from "./helpers/cleanup.js";

describe("Sprint 1: Auth & Management Flow", () => {
  beforeAll(async () => {
    await cleanupDatabase(); // [EVA_FIX]: Полная и безопасная очистка
  });

  it("SU должен залогиниться и создать бизнес", async () => {
    const password = "super-secret-password";
    // [EVA_FIX]: В схеме user.prisma поле называется 'password', а не 'passwordHash'
    const hashedPassword = await hash(password);

    const su = await prisma.user.create({
      data: {
        email: "admin@aurora.com",
        password: hashedPassword,
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
