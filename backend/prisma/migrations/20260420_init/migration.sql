-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "user_alert_settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "morning_time" TEXT NOT NULL,
    "noon_time" TEXT NOT NULL,
    "evening_time" TEXT NOT NULL,
    "pre_alert_minutes" INTEGER NOT NULL DEFAULT 15,
    "on_time_enabled" BOOLEAN NOT NULL DEFAULT true,
    "timezone" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "user_alert_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "medicines" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "rx_name" TEXT NOT NULL,
    "days_of_supply" INTEGER NOT NULL,
    "total_available_qty" REAL NOT NULL,
    "remaining_qty" REAL NOT NULL,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "medicines_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "medicine_schedules" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "medicine_id" INTEGER NOT NULL,
    "slot" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "dose_time" TEXT NOT NULL,
    "qty" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "medicine_schedules_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "medicines" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reminder_events" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "medicine_id" INTEGER NOT NULL,
    "schedule_id" INTEGER NOT NULL,
    "alert_type" TEXT NOT NULL,
    "scheduled_for" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "reminder_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reminder_events_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "medicines" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reminder_events_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "medicine_schedules" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "medicine_intake_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reminder_event_id" INTEGER NOT NULL,
    "medicine_id" INTEGER NOT NULL,
    "qty_taken" REAL NOT NULL,
    "taken_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "medicine_intake_logs_reminder_event_id_fkey" FOREIGN KEY ("reminder_event_id") REFERENCES "reminder_events" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "medicine_intake_logs_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "medicines" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "uploaded_reports" (
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
    CONSTRAINT "uploaded_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "report_analyses" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "report_id" INTEGER NOT NULL,
    "summary_layman" TEXT NOT NULL,
    "risks_json" TEXT NOT NULL,
    "medicine_suggestions_json" TEXT NOT NULL,
    "vitamin_suggestions_json" TEXT NOT NULL,
    "notes_json" TEXT NOT NULL,
    "disclaimer" TEXT NOT NULL,
    "ai_model" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "report_analyses_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "uploaded_reports" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_alert_settings_user_id_key" ON "user_alert_settings"("user_id");

-- CreateIndex
CREATE INDEX "medicines_user_id_idx" ON "medicines"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "medicine_schedules_medicine_slot_key" ON "medicine_schedules"("medicine_id", "slot");

-- CreateIndex
CREATE UNIQUE INDEX "reminder_events_dedupe_idx" ON "reminder_events"("user_id", "medicine_id", "schedule_id", "alert_type", "scheduled_for");

-- CreateIndex
CREATE INDEX "reminder_events_user_id_idx" ON "reminder_events"("user_id");

-- CreateIndex
CREATE INDEX "reminder_events_scheduled_for_idx" ON "reminder_events"("scheduled_for");

-- CreateIndex
CREATE INDEX "uploaded_reports_user_id_idx" ON "uploaded_reports"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "report_analyses_report_id_key" ON "report_analyses"("report_id");
