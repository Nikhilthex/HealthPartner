import path from "node:path";

import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_PATH: z.string().min(1).default("./data/healthpartner.db"),
  SESSION_SECRET: z.string().min(12, "SESSION_SECRET must be at least 12 characters long."),
  SESSION_COOKIE_NAME: z.string().min(1).default("health_partner_session"),
  AUTH_SEED_ENABLED: z
    .string()
    .optional()
    .transform((value) => value === undefined ? true : value === "true"),
  AUTH_SEED_USERNAME: z.string().min(1).default("demo"),
  AUTH_SEED_PASSWORD: z.string().min(8).default("secret123")
});

export type AppConfig = {
  nodeEnv: "development" | "test" | "production";
  port: number;
  databasePath: string;
  sessionSecret: string;
  sessionCookieName: string;
  authSeedEnabled: boolean;
  authSeedUsername: string;
  authSeedPassword: string;
};

export const loadConfig = (overrides: Partial<NodeJS.ProcessEnv> = {}): AppConfig => {
  const parsed = envSchema.parse({
    ...process.env,
    ...overrides
  });

  return {
    nodeEnv: parsed.NODE_ENV,
    port: parsed.PORT,
    databasePath: path.resolve(parsed.DATABASE_PATH),
    sessionSecret: parsed.SESSION_SECRET,
    sessionCookieName: parsed.SESSION_COOKIE_NAME,
    authSeedEnabled: parsed.AUTH_SEED_ENABLED,
    authSeedUsername: parsed.AUTH_SEED_USERNAME,
    authSeedPassword: parsed.AUTH_SEED_PASSWORD
  };
};
