// packages/api/tests/routers/business.test.ts
import { prisma } from "@simple-coffeeshop/db";
import { beforeAll, describe, expect, it } from "vitest";
import { appRouter } from "../../src/root.js";
import { createInnerTRPCContext } from "../../src/trpc.js";
import { cleanupDatabase } from "../helpers/cleanup.js";

describe("Business Router: Ownership Handshake", () => {
  let ownerId: string;

  beforeAll(async () => {
    // [EVA_FIX]: Очистка и создание пользователя с валидной PlatformRole
    await cleanupDatabase(); // [EVA_FIX]: Устраняет ошибку RESTRICT на EmployeeProfile

    const owner = await prisma.user.create({
      data: {
        email: "former-owner@test.com",
        password: "hashed_password",
        platformRole: "NONE", // Используем NONE, владение определяется через ownerId бизнеса
      },
    });
    ownerId = owner.id;
  });

  it("должен запретить подтверждение передачи прав до истечения 168 часов", async () => {
    const business = await prisma.business.create({
      data: { name: `Transfer Corp-${Date.now()}`, ownerId },
    });

    const handshake = await prisma.handshake.create({
      data: {
        businessId: business.id,
        formerOwnerId: ownerId,
        newOwnerEmail: "next@owner.com",
        effectiveAt: new Date(Date.now() + 168 * 60 * 60 * 1000), // Кулдаун 7 дней
        status: "PENDING",
      },
    });

    const ctx = createInnerTRPCContext({ businessId: business.id, userId: "potential-owner" });
    const caller = appRouter.createCaller(ctx);

    await expect(caller.business.acceptOwnership({ handshakeId: handshake.id })).rejects.toThrow(/Cooldown|период/i);
  });

  it("должен позволить мгновенную отмену (Revocation) текущим владельцем", async () => {
    const handshake = await prisma.handshake.findFirstOrThrow({
      where: { status: "PENDING", newOwnerEmail: "next@owner.com" },
    });

    const ctx = createInnerTRPCContext({ businessId: handshake.businessId, userId: ownerId });
    const caller = appRouter.createCaller(ctx);

    await caller.business.revokeOwnershipTransfer({ handshakeId: handshake.id });

    const updated = await prisma.handshake.findUnique({ where: { id: handshake.id } });
    expect(updated?.status).toBe("REVOKED");
  });
});
