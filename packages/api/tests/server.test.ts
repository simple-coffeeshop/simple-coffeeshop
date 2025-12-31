// packages/api/tests/server.test.ts

import type { createIsolatedClient, prisma } from "@simple-coffeeshop/db";
import { describe, expect, it } from "vitest";
import { appRouter } from "../src/root";
import { createTRPCContext } from "../src/trpc";

describe("Server Infrastructure & ESM Runtime", () => {
  it("должен корректно инициализировать контекст из заголовков запроса", async () => {
    // Имитируем нативный Request (как в fetch API / Node.js 20+)
    const mockRequest = new Request("http://localhost:3000/trpc/network.listUnits", {
      headers: {
        "x-user-id": "test-user-123",
        "x-business-id": "test-biz-456",
      },
    });

    const ctx = await createTRPCContext({ req: mockRequest });

    expect(ctx.userId).toBe("test-user-123");
    expect(ctx.businessId).toBe("test-biz-456");
    // Проверяем наличие изолированного клиента БД
    expect(ctx.db).toBeDefined();
  });

  it("корневой роутер должен содержать модули auth и network", () => {
    const caller = appRouter.createCaller({
      // Теперь TS видит переменные и typeof отработает корректно
      prisma: {} as unknown as typeof prisma,
      db: {} as unknown as ReturnType<typeof createIsolatedClient>,
      userId: null,
      businessId: null,
      platformRole: "NONE",
      is2FAVerified: false,
    });

    expect(caller.auth).toBeDefined();
    expect(caller.network).toBeDefined();
  });

  it("должен корректно отрабатывать ESM-импорты (Smoke Test)", async () => {
    // В tRPC v11 проверяем наличие процедуры login вместо старой requestMagicLink
    expect(appRouter._def.procedures).toHaveProperty("auth.login");
  });
});
