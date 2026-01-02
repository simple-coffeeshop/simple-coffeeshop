// packages/api/tests/routers/handshake.test.ts
import { prisma } from "@simple-coffeeshop/db";
import { beforeAll, describe, expect, it } from "vitest";
import { appRouter } from "../../src/root.js";
import { createInnerTRPCContext } from "../../src/trpc.js";
import { cleanupDatabase } from "../helpers/cleanup.js";

describe("Handshake Router", () => {
  beforeAll(async () => {
    await cleanupDatabase(); // [EVA_FIX]: Устраняет ошибку RESTRICT на EmployeeProfile
  });

  it("должен инициализировать процесс передачи прав по Email", async () => {
    const owner = await prisma.user.create({
      data: {
        email: "sender@aurora.com",
        password: "secure_hash",
        platformRole: "NONE", // Исправлено: OWNER -> NONE
      },
    });

    const business = await prisma.business.create({
      data: { name: "Handshake Test Corp", ownerId: owner.id },
    });

    const ctx = createInnerTRPCContext({
      userId: owner.id,
      businessId: business.id,
      platformRole: "NONE",
    });

    const caller = appRouter.createCaller(ctx);

    const result = await caller.business.inviteOwner({
      businessId: business.id,
      email: "invitee@test.com",
    });

    expect(result.newOwnerEmail).toBe("invitee@test.com");
    expect(result.status).toBe("PENDING");
  });
});
