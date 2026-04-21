import { DateTime } from 'luxon';
import type { APIRequestContext } from '@playwright/test';

export function uniqueName(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

export function isoNowRounded(): string {
  return DateTime.utc().set({ second: 0, millisecond: 0 }).toISO() as string;
}

export async function createMedicineForTest(request: APIRequestContext, options?: { rxName?: string; doseTime?: string }) {
  const payload = {
    rxName: options?.rxName ?? uniqueName('Medicine'),
    daysOfSupply: 30,
    totalAvailableQty: 60,
    schedules: [
      {
        slot: 'morning',
        enabled: true,
        doseTime: options?.doseTime ?? '08:00',
        qty: 1
      },
      {
        slot: 'noon',
        enabled: false,
        doseTime: '13:00',
        qty: 0
      },
      {
        slot: 'evening',
        enabled: true,
        doseTime: '20:00',
        qty: 1
      }
    ]
  };

  const response = await request.post('/api/medicines', {
    data: payload
  });

  return {
    response,
    payload,
    json: await response.json()
  };
}
