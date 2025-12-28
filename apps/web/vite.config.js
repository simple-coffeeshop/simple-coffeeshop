// apps/web/vite.config.ts
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Автоматически подключаем переменные и миксины во все файлы
        // ВАЖНО: Пути должны соответствовать созданной структуре
        additionalData: `
          @use "@/shared/styles/variables" as *;
          @use "@/shared/styles/mixins" as *;
        `,
      },
    },
  },
  server: {
    port: 3000,
    host: true,
  },
});
