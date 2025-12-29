// packages/api/tests/routers/auth.test.ts

import { prisma } from "@simple-coffeeshop/db";
import { describe, expect, it, vi } from "vitest";
import type { logger } from "../../src/lib/logger"; // Импортируем ТИП логгера
import { authRouter } from "../../src/routers/auth";

vi.mock("@simple-coffeeshop/db", () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
    },
  },
}));

describe("Auth Router Integration", () => {
  it("should return success even if user is not found in DB", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

    // Создаем типобезопасный мок логгера
    const mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      trace: vi.fn(),
      fatal: vi.fn(),
    } as unknown as typeof logger;

    const caller = authRouter.createCaller({
      prisma,
      db: null,
      userId: null,
      businessId: null,
      logger: mockLogger, // Теперь тут нет any
    });

    const result = await caller.requestMagicLink({ email: "new-user@test.com" });

    expect(result.success).toBe(true);
    expect(prisma.user.findFirst).toHaveBeenCalled();
  });
});
