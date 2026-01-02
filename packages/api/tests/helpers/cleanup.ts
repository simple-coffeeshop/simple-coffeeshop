import { prisma } from "@simple-coffeeshop/db";

/**
 * Очищает базу данных в строгом порядке, соответствующем
 * ограничениям внешних ключей (Foreign Key Constraints).
 */
export async function cleanupDatabase() {
  // Порядок важен: сначала удаляем таблицы, которые ссылаются на других

  // 1. Уровень 3 (Самые глубокие зависимости)
  // Удаляем записи, зависящие от Юнитов и Инвайтов
  await prisma.handshake.deleteMany();
  await prisma.invite.deleteMany();
  await prisma.employeeProfile.deleteMany();

  // 2. Уровень 2 (Зависимости среднего уровня)
  // Удаляем Юниты (зависят от Enterprise и Business)
  await prisma.unit.deleteMany();

  // 3. Уровень 1 (Зависимости от Business)
  // Удаляем Enterprise (зависят от Business)
  await prisma.enterprise.deleteMany();

  // 4. Корневой уровень (Business ссылается на User через ownerId)
  // Чтобы избежать конфликта при удалении User, сначала обнуляем или удаляем Business
  await prisma.business.deleteMany();

  // 5. Базовый уровень
  // Теперь можно безопасно удалить пользователей
  await prisma.user.deleteMany();
}
