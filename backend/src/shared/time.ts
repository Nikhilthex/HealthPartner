import { DateTime, IANAZone } from 'luxon';

export const SLOT_ORDER: Record<string, number> = {
  morning: 1,
  noon: 2,
  evening: 3
};

export function isValidHHmm(value: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

export function isValidTimezone(value: string): boolean {
  return IANAZone.isValidZone(value);
}

export function getDailyQtyPlanned(schedules: Array<{ enabled: boolean; qty: number }>): number {
  return schedules.reduce((sum, item) => (item.enabled ? sum + item.qty : sum), 0);
}

export function calculateEstimatedDepletionDate(remainingQty: number, dailyQtyPlanned: number, fromUtc = DateTime.utc()): string | null {
  if (dailyQtyPlanned <= 0) {
    return null;
  }
  const days = Math.max(1, Math.ceil(remainingQty / dailyQtyPlanned));
  return fromUtc.plus({ days: days - 1 }).toISODate();
}

export function toUtcIsoFromLocalDateTime(dateIso: string, hhmm: string, timezone: string): string {
  const [hour, minute] = hhmm.split(':').map(Number);
  const date = DateTime.fromISO(dateIso, { zone: timezone }).set({
    hour,
    minute,
    second: 0,
    millisecond: 0
  });
  return date.toUTC().toISO() as string;
}

export function enumerateLocalDates(startUtcIso: string, endUtcIso: string, timezone: string): string[] {
  const dates: string[] = [];
  let cursor = DateTime.fromISO(startUtcIso, { zone: 'utc' }).setZone(timezone).startOf('day');
  const end = DateTime.fromISO(endUtcIso, { zone: 'utc' }).setZone(timezone).startOf('day');

  while (cursor <= end) {
    dates.push(cursor.toISODate() as string);
    cursor = cursor.plus({ days: 1 });
  }

  return dates;
}
