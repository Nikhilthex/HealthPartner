import type { Prisma, PrismaClient } from '@prisma/client';
import { DateTime } from 'luxon';
import { prisma } from '../../shared/prisma/client';
import { errorFactory } from '../../shared/errors';
import { enumerateLocalDates, toUtcIsoFromLocalDateTime } from '../../shared/time';

type DbClient = PrismaClient | Prisma.TransactionClient;

const ALERT_TYPE = {
  PRE: 'pre',
  ON_TIME: 'on_time'
} as const;

const REMINDER_STATUS = {
  PENDING: 'pending',
  SHOWN: 'shown',
  TAKEN: 'taken',
  MISSED: 'missed',
  DISMISSED: 'dismissed'
} as const;

function toClient(client?: DbClient): DbClient {
  return client ?? prisma;
}

export async function clearFutureReminderEventsForMedicine(
  userId: number,
  medicineId: number,
  client?: DbClient
): Promise<void> {
  const db = toClient(client);
  await db.reminderEvent.updateMany({
    where: {
      userId,
      medicineId,
      scheduledFor: { gte: new Date() },
      status: { in: [REMINDER_STATUS.PENDING, REMINDER_STATUS.SHOWN] }
    },
    data: {
      status: REMINDER_STATUS.DISMISSED
    }
  });
}

export async function clearFutureReminderEventsForUser(userId: number, client?: DbClient): Promise<void> {
  const db = toClient(client);
  await db.reminderEvent.updateMany({
    where: {
      userId,
      scheduledFor: { gte: new Date() },
      status: { in: [REMINDER_STATUS.PENDING, REMINDER_STATUS.SHOWN] }
    },
    data: {
      status: REMINDER_STATUS.DISMISSED
    }
  });
}

export async function ensureReminderEventsForWindow(
  userId: number,
  nowIso: string,
  windowMinutes: number,
  client?: DbClient
): Promise<void> {
  const db = toClient(client);

  const settings = await db.userAlertSettings.findUnique({
    where: { userId }
  });

  if (!settings) {
    throw errorFactory.internal('Alert settings missing for the current user.');
  }

  const startUtc = DateTime.fromISO(nowIso, { zone: 'utc' });
  const endUtc = startUtc.plus({ minutes: windowMinutes });
  const localDates = enumerateLocalDates(startUtc.toISO() as string, endUtc.toISO() as string, settings.timezone);

  const medicines = await db.medicine.findMany({
    where: {
      userId,
      isActive: true
    },
    include: {
      schedules: true
    }
  });

  for (const medicine of medicines) {
    for (const schedule of medicine.schedules) {
      if (!schedule.enabled) {
        continue;
      }

      for (const dateIso of localDates) {
        const onTimeUtcIso = toUtcIsoFromLocalDateTime(dateIso, schedule.doseTime, settings.timezone);
        const onTimeUtc = DateTime.fromISO(onTimeUtcIso, { zone: 'utc' });

        if (settings.preAlertMinutes > 0) {
          const preUtc = onTimeUtc.minus({ minutes: settings.preAlertMinutes });
          if (preUtc >= startUtc && preUtc <= endUtc) {
            await upsertReminderEvent({
              db,
              userId,
              medicineId: medicine.id,
              scheduleId: schedule.id,
              alertType: ALERT_TYPE.PRE,
              scheduledFor: preUtc.toJSDate()
            });
          }
        }

        if (settings.onTimeEnabled && onTimeUtc >= startUtc && onTimeUtc <= endUtc) {
          await upsertReminderEvent({
            db,
            userId,
            medicineId: medicine.id,
            scheduleId: schedule.id,
            alertType: ALERT_TYPE.ON_TIME,
            scheduledFor: onTimeUtc.toJSDate()
          });
        }
      }
    }
  }
}

async function upsertReminderEvent(args: {
  db: DbClient;
  userId: number;
  medicineId: number;
  scheduleId: number;
  alertType: string;
  scheduledFor: Date;
}): Promise<void> {
  await args.db.reminderEvent.upsert({
    where: {
      userId_medicineId_scheduleId_alertType_scheduledFor: {
        userId: args.userId,
        medicineId: args.medicineId,
        scheduleId: args.scheduleId,
        alertType: args.alertType,
        scheduledFor: args.scheduledFor
      }
    },
    update: {},
    create: {
      userId: args.userId,
      medicineId: args.medicineId,
      scheduleId: args.scheduleId,
      alertType: args.alertType,
      scheduledFor: args.scheduledFor,
      status: REMINDER_STATUS.PENDING
    }
  });
}

export async function getDueReminders(input: {
  userId: number;
  nowIso: string;
  windowMinutes: number;
}): Promise<{
  reminders: Array<{
    id: number;
    medicineId: number;
    rxName: string;
    slot: string;
    alertType: string;
    doseTime: string;
    qty: number;
    scheduledFor: string;
    status: string;
    displayMessage: string;
  }>;
  meta: { serverTime: string; windowMinutes: number };
}> {
  await ensureReminderEventsForWindow(input.userId, input.nowIso, input.windowMinutes);

  const nowDate = new Date(input.nowIso);
  const endDate = DateTime.fromISO(input.nowIso, { zone: 'utc' }).plus({ minutes: input.windowMinutes }).toJSDate();

  const rows = await prisma.reminderEvent.findMany({
    where: {
      userId: input.userId,
      scheduledFor: {
        gte: nowDate,
        lte: endDate
      },
      status: REMINDER_STATUS.PENDING
    },
    include: {
      medicine: true,
      schedule: true
    },
    orderBy: {
      scheduledFor: 'asc'
    }
  });

  const reminders = rows.map((row) => ({
    id: row.id,
    medicineId: row.medicineId,
    rxName: row.medicine.rxName,
    slot: row.schedule.slot,
    alertType: row.alertType,
    doseTime: row.schedule.doseTime,
    qty: row.schedule.qty,
    scheduledFor: row.scheduledFor.toISOString(),
    status: row.status,
    displayMessage: `Reminder: Take ${row.schedule.qty} dose of ${row.medicine.rxName} at ${row.schedule.doseTime}.`
  }));

  return {
    reminders,
    meta: {
      serverTime: input.nowIso,
      windowMinutes: input.windowMinutes
    }
  };
}

export async function acknowledgeReminder(input: { userId: number; reminderId: number }): Promise<{ id: number; status: string }> {
  const reminder = await prisma.reminderEvent.findFirst({
    where: {
      id: input.reminderId,
      userId: input.userId
    }
  });

  if (!reminder) {
    throw errorFactory.notFound();
  }

  if (reminder.status !== REMINDER_STATUS.PENDING && reminder.status !== REMINDER_STATUS.SHOWN) {
    throw errorFactory.conflict('Reminder cannot be acknowledged in its current state.');
  }

  const updated = await prisma.reminderEvent.update({
    where: { id: reminder.id },
    data: { status: REMINDER_STATUS.SHOWN }
  });

  return { id: updated.id, status: updated.status };
}

export async function dismissReminder(input: { userId: number; reminderId: number }): Promise<{ id: number; status: string }> {
  const reminder = await prisma.reminderEvent.findFirst({
    where: {
      id: input.reminderId,
      userId: input.userId
    }
  });

  if (!reminder) {
    throw errorFactory.notFound();
  }

  if (reminder.status !== REMINDER_STATUS.PENDING && reminder.status !== REMINDER_STATUS.SHOWN) {
    throw errorFactory.conflict('Reminder cannot be dismissed in its current state.');
  }

  const updated = await prisma.reminderEvent.update({
    where: { id: reminder.id },
    data: { status: REMINDER_STATUS.DISMISSED }
  });

  return { id: updated.id, status: updated.status };
}
