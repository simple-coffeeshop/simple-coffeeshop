import path from "node:path";
import { config } from "dotenv";

// Принудительно загружаем переменные из корня
config({ path: path.resolve(__dirname, "../../../.env") });

// Подменяем основную базу тестовой
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
