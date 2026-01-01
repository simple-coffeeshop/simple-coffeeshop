import * as argon2 from "argon2";

async function main() {
  console.log("🌑 [EVA]: Запуск через системный конфиг...");

  /**
   * 1. Импортируем конфиг, чтобы загрузить переменные окружения.
   */
  const { dbUrl } = await import("../prisma.config.js");

  if (!dbUrl || dbUrl.includes("${")) {
    throw new Error(`[BOOTSTRAP]: Ошибка интерполяции. URL не готов: ${dbUrl}`);
  }

  /**
   * 2. Впрыскиваем URL в окружение.
   */
  process.env.DATABASE_URL = dbUrl;

  const debugUrl = dbUrl.replace(/:.*@/, ":****@");
  console.log(`✅ URL успешно подготовлен: ${debugUrl}`);

  /**
   * 3. Импортируем УЖЕ настроенный prisma клиент из твоего index.ts.
   * Он уже содержит внутри PrismaPg адаптер и правильные логи.
   */
  const { prisma } = await import("../index.js");

  try {
    const email = "admin@aurora.com";
    const password = "admin-password-123";
    const passwordHash = await argon2.hash(password);

    console.log("🚀 Синхронизация пользователя ROOT...");

    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash, platformRole: "ROOT" },
      create: { email, passwordHash, platformRole: "ROOT" },
    });

    console.log("---");
    console.log(`✨ УСПЕХ: Пользователь ${user.email} создан/обновлен.`);
    console.log("---");
  } catch (err) {
    console.error("❌ Ошибка базы данных:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
