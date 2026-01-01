// packages/db/tests/env.test.ts [АКТУАЛЬНО]

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { findProjectRoot, validateDbUrl } from "../env.ts";

describe("Root Detection Logic", () => {
  it("[MEDIUM] Должен находить корень проекта по маркеру pnpm-workspace.yaml", () => {
    const root = findProjectRoot();
    const workspaceFile = path.join(root, "pnpm-workspace.yaml");
    expect(fs.existsSync(workspaceFile)).toBe(true);
  });
});

describe("Database Environment Validation", () => {
  it("[LOW] Должен возвращать DATABASE_URL в режиме development", () => {
    const mockEnv = {
      NODE_ENV: "development",
      DATABASE_URL: "postgresql://dev_db",
    };
    /**
     * [EVA_FIX]: Безопасное приведение через unknown.
     * Исключаем ключевое слово any.
     */
    const env = mockEnv as unknown as NodeJS.ProcessEnv;
    const url = validateDbUrl(env);
    expect(url).toBe("postgresql://dev_db");
  });

  it("[MEDIUM] Должен использовать TEST_DATABASE_URL при NODE_ENV=test", () => {
    const mockEnv = {
      NODE_ENV: "test",
      TEST_DATABASE_URL: "postgresql://test_db",
    };
    const env = mockEnv as unknown as NodeJS.ProcessEnv;
    const url = validateDbUrl(env);
    expect(url).toBe("postgresql://test_db");
  });

  it("[CRITICAL] Должен выбрасывать ошибку, если URL отсутствует", () => {
    const mockEnv = { NODE_ENV: "development", DATABASE_URL: "" };
    const env = mockEnv as unknown as NodeJS.ProcessEnv;
    expect(() => validateDbUrl(env)).toThrow(/DATABASE_URL is missing/);
  });
});
