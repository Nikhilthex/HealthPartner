import Database from "better-sqlite3";

import { createApp } from "../../src/app";

export const createTestApp = async () => {
  const db = new Database(":memory:");
  const context = await createApp({
    configOverrides: {
      NODE_ENV: "test",
      DATABASE_PATH: ":memory:",
      SESSION_SECRET: "test-session-secret",
      AUTH_SEED_ENABLED: "true",
      AUTH_SEED_USERNAME: "demo",
      AUTH_SEED_PASSWORD: "secret123"
    },
    db
  });

  return context;
};
