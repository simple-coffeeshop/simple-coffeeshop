// packages/db/tests/env.test.ts [АКТУАЛЬНО]
import { describe, expect, it } from "vitest";
import { resolveDbUrl } from "../env.ts";

describe("Database Environment Logic", () => {
  it("[LOW] Должен возвращать DATABASE_URL в режиме development", () => {
    const mockEnv = {
      NODE_ENV: "development",
      DATABASE_URL: "postgresql://dev_db",
    };

    const url = resolveDbUrl(mockEnv as NodeJS.ProcessEnv);
    expect(url).toBe("postgresql://dev_db");
  });

  it("[MEDIUM] Должен использовать TEST_DATABASE_URL при NODE_ENV=test", () => {
    const mockEnv = {
      NODE_ENV: "test",
      TEST_DATABASE_URL: "postgresql://test_db",
    };

    const url = resolveDbUrl(mockEnv as NodeJS.ProcessEnv);
    expect(url).toBe("postgresql://test_db");
  });

  it("[CRITICAL] Должен выбрасывать ошибку, если URL отсутствует", () => {
    const mockEnv = {
      NODE_ENV: "development",
      DATABASE_URL: "",
    };

    expect(() => resolveDbUrl(mockEnv as NodeJS.ProcessEnv)).toThrow(/DATABASE_URL is missing/);
  });

  it("[LOW] Должен отдавать приоритет TEST_DATABASE_URL в режиме теста", () => {
    const mockEnv = {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://wrong_db",
      TEST_DATABASE_URL: "postgresql://correct_db",
    };

    const url = resolveDbUrl(mockEnv as NodeJS.ProcessEnv);
    expect(url).toBe("postgresql://correct_db");
  });
});
