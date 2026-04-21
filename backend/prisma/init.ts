import { PrismaClient } from '@prisma/client';
import { ensureRuntimeDirectories } from '../src/config/env';

const DDL_STATEMENTS = [
  `PRAGMA foreign_keys = ON;`,
  `CREATE TABLE IF NOT EXISTS "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL UNIQUE,
    "password_hash" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS "user_alert_settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL UNIQUE,
    "morning_time" TEXT NOT NULL,
    "noon_time" TEXT NOT NULL,
    "evening_time" TEXT NOT NULL,
    "pre_alert_minutes" INTEGER NOT NULL DEFAULT 15,
    "on_time_enabled" INTEGER NOT NULL DEFAULT 1,
    "timezone" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS "medicines" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "rx_name" TEXT NOT NULL,
    "days_of_supply" INTEGER NOT NULL,
    "total_available_qty" REAL NOT NULL,
    "remaining_qty" REAL NOT NULL,
    "notes" TEXT,
    "is_active" INTEGER NOT NULL DEFAULT 1,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS "medicine_schedules" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "medicine_id" INTEGER NOT NULL,
    "slot" TEXT NOT NULL,
    "enabled" INTEGER NOT NULL DEFAULT 1,
    "dose_time" TEXT NOT NULL,
    "qty" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    FOREIGN KEY ("medicine_id") REFERENCES "medicines" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS "reminder_events" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "medicine_id" INTEGER NOT NULL,
    "schedule_id" INTEGER NOT NULL,
    "alert_type" TEXT NOT NULL,
    "scheduled_for" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("medicine_id") REFERENCES "medicines" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("schedule_id") REFERENCES "medicine_schedules" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS "medicine_intake_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reminder_event_id" INTEGER NOT NULL,
    "medicine_id" INTEGER NOT NULL,
    "qty_taken" REAL NOT NULL,
    "taken_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("reminder_event_id") REFERENCES "reminder_events" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("medicine_id") REFERENCES "medicines" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS "uploaded_reports" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "original_filename" TEXT NOT NULL,
    "stored_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "extracted_text" TEXT,
    "analysis_status" TEXT NOT NULL DEFAULT 'uploaded',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS "report_analyses" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "report_id" INTEGER NOT NULL UNIQUE,
    "summary_layman" TEXT NOT NULL,
    "risks_json" TEXT NOT NULL,
    "medicine_suggestions_json" TEXT NOT NULL,
    "vitamin_suggestions_json" TEXT NOT NULL,
    "notes_json" TEXT NOT NULL,
    "disclaimer" TEXT NOT NULL,
    "ai_model" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("report_id") REFERENCES "uploaded_reports" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "medicine_schedules_medicine_slot_key" ON "medicine_schedules"("medicine_id", "slot");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "reminder_events_dedupe_idx" ON "reminder_events"("user_id", "medicine_id", "schedule_id", "alert_type", "scheduled_for");`,
  `CREATE INDEX IF NOT EXISTS "medicines_user_id_idx" ON "medicines"("user_id");`,
  `CREATE INDEX IF NOT EXISTS "reminder_events_user_id_idx" ON "reminder_events"("user_id");`,
  `CREATE INDEX IF NOT EXISTS "reminder_events_scheduled_for_idx" ON "reminder_events"("scheduled_for");`,
  `CREATE INDEX IF NOT EXISTS "uploaded_reports_user_id_idx" ON "uploaded_reports"("user_id");`
];

export async function initializeDatabase(prismaClient: PrismaClient): Promise<void> {
  ensureRuntimeDirectories();
  for (const statement of DDL_STATEMENTS) {
    await prismaClient.$executeRawUnsafe(statement);
  }
}

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  await initializeDatabase(prisma);
  await prisma.$disconnect();
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
