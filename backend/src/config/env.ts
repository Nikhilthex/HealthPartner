import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().default('file:../data/healthpartner.db'),
  UPLOAD_DIR: z.string().default('./uploads'),
  SESSION_SECRET: z.string().min(16).default('healthpartner-dev-session-secret'),
  OPENAI_API_KEY: z.preprocess((value) => (value === '' ? undefined : value), z.string().optional()),
  OPENAI_BASE_URL: z.preprocess((value) => (value === '' ? undefined : value), z.string().url().optional()),
  OPENAI_MODEL: z.string().default(process.env.AI_MODEL ?? 'gpt-5.4-mini'),
  DEFAULT_TIMEZONE: z.string().default('Asia/Kolkata')
});

export const env = envSchema.parse(process.env);

export function resolveDatabaseFilePath(): string | null {
  if (!env.DATABASE_URL.startsWith('file:')) {
    return null;
  }

  const rawPath = env.DATABASE_URL.replace('file:', '');
  if (path.isAbsolute(rawPath)) {
    return rawPath;
  }

  const prismaDir = path.resolve(process.cwd(), 'prisma');
  return path.resolve(prismaDir, rawPath);
}

export function ensureRuntimeDirectories(): void {
  const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
  const databasePath = resolveDatabaseFilePath();
  const dbDir = databasePath ? path.dirname(databasePath) : null;

  fs.mkdirSync(uploadDir, { recursive: true });
  if (dbDir) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
}
