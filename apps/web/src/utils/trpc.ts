// apps/web/src/utils/trpc.ts

import type { AppRouter } from "@simple-coffeeshop/api"; // Убедись, что путь к типам API верный
import { createTRPCReact } from "@trpc/react-query";

export const trpc = createTRPCReact<AppRouter>();
