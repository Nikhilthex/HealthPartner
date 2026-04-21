import { PrismaClient } from '@prisma/client';
import { ensureRuntimeDirectories } from '../src/config/env';
import { initializeDatabase } from './init';
import { seedDefaultData } from './seed-data';

async function clearAllData(prisma: PrismaClient): Promise<void> {
  const statements = [
    `DELETE FROM "report_analyses";`,
    `DELETE FROM "uploaded_reports";`,
    `DELETE FROM "medicine_intake_logs";`,
    `DELETE FROM "reminder_events";`,
    `DELETE FROM "medicine_schedules";`,
    `DELETE FROM "medicines";`,
    `DELETE FROM "user_alert_settings";`,
    `DELETE FROM "users";`,
    `DELETE FROM "sqlite_sequence";`
  ];

  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }
}

async function main(): Promise<void> {
  ensureRuntimeDirectories();

  const prisma = new PrismaClient();
  await initializeDatabase(prisma);
  await clearAllData(prisma);
  await seedDefaultData(prisma);
  await prisma.$disconnect();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
