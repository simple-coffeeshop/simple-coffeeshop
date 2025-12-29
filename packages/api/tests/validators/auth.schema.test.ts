// packages/api/tests/validators/auth.schema.test.ts
import { describe, expect, it } from "vitest";
import { RequestMagicLinkSchema } from "../../src/validators/auth.schema";

describe("Auth Validators", () => {
  it("should validate and normalize a correct email", () => {
    // Проверяем тримминг и приведение к нижнему регистру
    const result = RequestMagicLinkSchema.parse({ email: "  EVA@Google.Com " });
    expect(result.email).toBe("eva@google.com");
  });

  it("should fail on invalid email format", () => {
    expect(() => RequestMagicLinkSchema.parse({ email: "invalid-email" })).toThrow();
  });
});
