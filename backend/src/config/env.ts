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
  AI_PROVIDER_URL: z.string().url().optional(),
  AI_PROVIDER_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default('gpt-5.4-mini'),
  DEFAULT_TIMEZONE: z.string().default('Asia/Kolkata'),
  SINGLE_USER_ID: z.coerce.number().int().positive().default(1)
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
