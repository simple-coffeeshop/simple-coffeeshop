// packages/db/scripts/bootstrap-root.ts
import * as argon2 from "argon2";
import { getAdminConfig } from "../env.js";
import type { PlatformRoleType } from "../index.js";

/**
 * Основная функция инициализации ROOT-пользователя.
 * Использует ADMIN_EMAIL и ADMIN_PASSWORD из .env файла.
 */
async function main(): Promise<void> {
  console.log("🌑 [EVA]: Запуск инициализации ROOT-пользователя...");

  try {
    /**
     * [EVA_FIX]: Получаем конфигурацию через валидатор в env.ts.
     * Это гарантирует наличие необходимых переменных окружения.
     */
    const { email, password } = getAdminConfig();

    /**
     * [EVA_FIX]: Импортируем настроенный инстанс prisma.
     * Расширение .js необходимо для нативной поддержки ESM в Node.js.
     */
    const { prisma } = await import("../index.js");

    const passwordHash = await argon2.hash(password);
    const role: PlatformRoleType = "ROOT";

    console.log(`🚀 Синхронизация администратора: ${email}`);

    /**
     * Upsert гарантирует, что мы либо создадим нового пользователя,
     * либо обновим пароль и роль существующего, предотвращая дубликаты.
     */
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
    console.log(`✨ УСПЕХ: Пользователь ${user.email} теперь имеет роль ROOT.`);
    console.log("---");
  } catch (err: unknown) {
    /**
     * [EVA_FIX]: Строгая обработка ошибок согласно системной инструкции.
     * Используем unknown и проверяем тип ошибки перед выводом.
     */
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("❌ Ошибка инициализации:", errorMessage);
    process.exit(1);
  }
}

/**
 * Точка входа в скрипт с обработкой необработанных исключений.
 */
main().catch((err: unknown) => {
  const errorMessage = err instanceof Error ? err.message : String(err);
  console.error("💀 Критическая ошибка скрипта:", errorMessage);
  process.exit(1);
});
