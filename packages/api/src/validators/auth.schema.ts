// packages/api/src/validators/auth.schema.ts
import { z } from "zod";

export const RequestMagicLinkSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()), // Используем новую standalone-схему
});

export const VerifyTokenSchema = z.object({
  token: z.string().min(1),
});
