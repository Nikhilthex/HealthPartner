import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { loadConfig } from "../src/config/env";
import { runMigrations } from "../src/db/migrations";
import { AuthRepository } from "../src/modules/auth/auth.repository";
import { AuthService } from "../src/modules/auth/auth.service";

describe("AuthService", () => {
  let db: Database.Database;
  let authService: AuthService;

  beforeEach(async () => {
    db = new Database(":memory:");
    runMigrations(db);
    authService = new AuthService(
      new AuthRepository(db),
      loadConfig({
        NODE_ENV: "test",
        DATABASE_PATH: ":memory:",
        SESSION_SECRET: "test-session-secret",
        AUTH_SEED_ENABLED: "true",
        AUTH_SEED_USERNAME: "demo",
        AUTH_SEED_PASSWORD: "secret123"
      })
    );

    await authService.ensureSeedUser();
  });

  afterEach(() => {
    db.close();
  });

  it("creates the seed user only once", async () => {
    await authService.ensureSeedUser();

    const count = db.prepare("SELECT COUNT(*) AS count FROM users WHERE username = ?").get("demo") as { count: number };
    expect(count.count).toBe(1);
  });

  it("authenticates when credentials are valid", async () => {
    const user = await authService.authenticate({ username: "demo", password: "secret123" });

    expect(user).toEqual({
      id: 1,
      username: "demo"
    });
  });

  it("rejects invalid credentials", async () => {
    await expect(authService.authenticate({ username: "demo", password: "bad-pass" })).rejects.toMatchObject({
      statusCode: 401,
      code: "INVALID_CREDENTIALS"
    });
  });
});
