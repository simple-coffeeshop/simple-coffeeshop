// packages/db/scripts/bootstrap-root.ts [АКТУАЛЬНО]
import * as argon2 from "argon2";
import { getAdminConfig } from "../env.js";
import type { PlatformRoleType } from "../index.js";

async function main(): Promise<void> {
  console.log("🌑 [EVA]: Запуск инициализации ROOT-пользователя...");

  try {
    const { email, password } = getAdminConfig();
    const { prisma } = await import("../index.js");

    const passwordHash = await argon2.hash(password);
    const role: PlatformRoleType = "ROOT";

    console.log(`🚀 Синхронизация администратора: ${email}`);

    const user = await prisma.user.upsert({
      where: { email: email.toLowerCase() },
      update: {
        passwordHash,
        platformRole: role,
      },
      create: {
        email: email.toLowerCase(),
        passwordHash,
        platformRole: role,
      },
    });

    console.log("---");
    console.log(`✨ УСПЕХ: Пользователь ${user.email} готов к работе.`);
    console.log("---");
  } catch (err: unknown) {
    /**
     * [EVA_FIX]: Строгая типизация ошибки через unknown.
     * Никаких 'any'.
     */
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("❌ Ошибка:", errorMessage);
    process.exit(1);
  }
}

main().catch((err: unknown) => {
  const errorMessage = err instanceof Error ? err.message : String(err);
  console.error("💀 Критический сбой:", errorMessage);
  process.exit(1);
});
