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
        // [WARNING]: Используйте только для переменных и миксинов без вывода CSS-кода
        additionalData: `@use "@simple-coffeeshop/ui/styles" as *;`,
      },
    },
  },
  server: {
    port: 3000,
    host: "127.0.0.1",
  },
  build: {
    sourcemap: true,
  },
});
