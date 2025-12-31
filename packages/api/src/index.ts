// packages/api/src/index.ts
import http from "node:http";
import { nodeHTTPRequestHandler } from "@trpc/server/adapters/node-http";
import { logger } from "./lib/logger.js";
import { appRouter } from "./root.js";
import { createTRPCContext } from "./trpc.js";

const PORT = Number(process.env.PORT) || 3001;

const server = http.createServer((req, res) => {
  // [SENIOR_FIX]: В tRPC v11 standalone мы сами извлекаем path из URL
  // Отсекаем префикс /trpc/ и query-параметры
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  const path = url.pathname.startsWith("/trpc/") ? url.pathname.slice(6) : url.pathname.slice(1);

  nodeHTTPRequestHandler({
    router: appRouter,
    path, // [FIX]: Теперь 'path' передается явно
    createContext: async () => {
      // Адаптация под Web Request API для твоего trpc.ts
      const compatRequest = {
        headers: {
          get: (name: string) => {
            const value = req.headers[name.toLowerCase()];
            return Array.isArray(value) ? value[0] : (value ?? null);
          },
        },
      } as unknown as Request;

      return createTRPCContext({ req: compatRequest });
    },
    req,
    res,
  });
});

server.listen(PORT, () => {
  logger.info(`🚀 API Server started on http://localhost:${PORT}/trpc`);
});

// [FIX]: server — это http.Server, вызываем .close() напрямую
process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Closing server...");
  server.close();
});
