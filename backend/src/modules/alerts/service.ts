import { prisma } from '../../shared/prisma/client';
import { env } from '../../config/env';
import { clearFutureReminderEventsForUser } from '../reminders/service';
import type { UpdateAlertSettingsInput } from './schemas';

const defaults = {
  morningTime: '08:00',
  noonTime: '13:00',
  eveningTime: '20:00',
  preAlertMinutes: 15,
  onTimeEnabled: true
};

async function ensureSettings(userId: number) {
  return prisma.userAlertSettings.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      ...defaults,
      timezone: env.DEFAULT_TIMEZONE
    }
  });
}

export async function getAlertSettings(userId: number): Promise<{
  morningTime: string;
  noonTime: string;
  eveningTime: string;
  preAlertMinutes: number;
  onTimeEnabled: boolean;
  timezone: string;
}> {
  const row = await ensureSettings(userId);

  return {
    morningTime: row.morningTime,
    noonTime: row.noonTime,
    eveningTime: row.eveningTime,
    preAlertMinutes: row.preAlertMinutes,
    onTimeEnabled: row.onTimeEnabled,
    timezone: row.timezone
  };
}

export async function updateAlertSettings(
  userId: number,
  input: UpdateAlertSettingsInput
): Promise<{
  settings: {
    morningTime: string;
    noonTime: string;
    eveningTime: string;
    preAlertMinutes: number;
    onTimeEnabled: boolean;
    timezone: string;
  };
  futureRemindersRebuilt: boolean;
}> {
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.userAlertSettings.upsert({
      where: { userId },
      update: {
        morningTime: input.morningTime,
        noonTime: input.noonTime,
        eveningTime: input.eveningTime,
        preAlertMinutes: input.preAlertMinutes,
        onTimeEnabled: input.onTimeEnabled,
        timezone: input.timezone
      },
      create: {
        userId,
        morningTime: input.morningTime,
        noonTime: input.noonTime,
        eveningTime: input.eveningTime,
        preAlertMinutes: input.preAlertMinutes,
        onTimeEnabled: input.onTimeEnabled,
        timezone: input.timezone
      }
    });

    await clearFutureReminderEventsForUser(userId, tx);

    return updated;
  });

  return {
    settings: {
      morningTime: result.morningTime,
      noonTime: result.noonTime,
      eveningTime: result.eveningTime,
      preAlertMinutes: result.preAlertMinutes,
      onTimeEnabled: result.onTimeEnabled,
      timezone: result.timezone
    },
    futureRemindersRebuilt: true
  };
}
