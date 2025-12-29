// packages/db/scripts/bootstrap-root.ts
import { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

async function bootstrap() {
  const email = process.argv[2];

  if (!email) {
    console.error("Usage: pnpm bootstrap-root <email>");
    process.exit(1);
  }

  try {
    // 1. Создаем пользователя с ролью ROOT [cite: 2, 3]
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        platformRole: "ROOT", // Даем God-mode права [cite: 2]
        is2FAEnabled: false, // Настраивается при первом входе
      },
    });

    // 2. Имитация токена для Magic Link
    const inviteToken = nanoid(32);

    console.log("-----------------------------------------");
    console.log("✅ ROOT USER CREATED IN DB");
    console.log(`ID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Platform Role: ${user.platformRole}`);
    console.log("-----------------------------------------");
    console.log("🚀 Ссылка для онбординга (пример):");
    console.log(`http://localhost:3000/auth/invite?token=${inviteToken}&email=${user.email}`);
    console.log("-----------------------------------------");
    console.log("Теперь ты можешь войти и настроить 2FA.");
  } catch (error) {
    console.error("❌ Ошибка при создании ROOT:", error);
  } finally {
    await prisma.$disconnect();
  }
}

bootstrap();
