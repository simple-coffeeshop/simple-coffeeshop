// packages/db/scripts/bootstrap-root.ts
import { PrismaClient } from "@prisma/client";
import { hash } from "argon2";

const prisma = new PrismaClient();

async function bootstrap() {
  const email = process.argv[2];
  const password = process.argv[3] || "admin123"; // Пароль можно передать вторым аргументом

  if (!email) {
    console.error("Usage: pnpm bootstrap-root <email> [password]");
    process.exit(1);
  }

  try {
    console.log(`[BOOTSTRAP]: Creating ROOT user: ${email}...`);

    // 1. Создаем пользователя с ролью ROOT и хешированным паролем
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash: await hash(password), // Хешируем для Login/Password
        platformRole: "ROOT", // God-mode права
        is2FAEnabled: false,
      },
    });

    console.log("-----------------------------------------");
    console.log("✅ ROOT USER CREATED IN DB");
    console.log(`ID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${password} (change after first login)`);
    console.log(`Platform Role: ${user.platformRole}`);
    console.log("-----------------------------------------");
    console.log("Теперь ты можешь войти в систему, используя эти данные.");
  } catch (error) {
    console.error("❌ Ошибка при создании ROOT:", error);
  } finally {
    await prisma.$disconnect();
  }
}

bootstrap();
