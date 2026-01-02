import { prisma } from "@simple-coffeeshop/db";
import { describe, expect, it } from "vitest";
import { router } from "../../src/root";
import { createInnerTRPCContext } from "../../src/trpc";

describe("Business Router: Ownership Handshake", () => {
  it("должен запретить подтверждение передачи прав до истечения 168 часов", async () => {
    const business = await prisma.business.create({ data: { name: "Transfer Corp" } });

    // Инициация передачи: effectiveAt через 7 дней
    const handshake = await prisma.handshake.create({
      data: {
        businessId: business.id,
        newOwnerEmail: "next@owner.com",
        effectiveAt: new Date(Date.now() + 168 * 60 * 60 * 1000),
        status: "PENDING",
      },
    });

    const ctx = createInnerTRPCContext({ businessId: business.id });
    const caller = router.createCaller(ctx);

    await expect(caller.business.acceptOwnership({ handshakeId: handshake.id })).rejects.toThrow(
      "Cooldown period is active",
    );
  });

  it("должен позволить мгновенную отмену (Revocation) текущим владельцем", async () => {
    const business = await prisma.business.findFirstOrThrow({ where: { name: "Transfer Corp" } });
    const handshake = await prisma.handshake.findFirstOrThrow({ where: { businessId: business.id } });

    const ctx = createInnerTRPCContext({ businessId: business.id });
    const caller = router.createCaller(ctx);

    await caller.business.revokeOwnershipTransfer({ handshakeId: handshake.id });

    const updated = await prisma.handshake.findUnique({ where: { id: handshake.id } });
    expect(updated?.status).toBe("REVOKED"); //
  });
});
