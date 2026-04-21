import { test, expect } from '@playwright/test';
import { DateTime } from 'luxon';
import { createMedicineForTest, isoNowRounded, uniqueName } from './helpers';

test.describe('Reminder APIs', () => {
  test('GET /api/reminders/due validates query params', async ({ request }) => {
    const response = await request.get('/api/reminders/due', {
      params: {
        now: 'not-a-date',
        windowMinutes: '-1'
      }
    });

    expect(response.status()).toBe(422);
    const body = await response.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  test('GET due, acknowledge, and dismiss reminder status transitions', async ({ request }) => {
    await request.put('/api/alert-settings', {
      data: {
        morningTime: '08:00',
        noonTime: '13:00',
        eveningTime: '20:00',
        preAlertMinutes: 15,
        onTimeEnabled: true,
        timezone: 'UTC'
      }
    });

    const nowIso = isoNowRounded();
    const doseTime = DateTime.fromISO(nowIso, { zone: 'utc' }).plus({ minutes: 15 }).toFormat('HH:mm');
    const created = await createMedicineForTest(request, {
      rxName: uniqueName('Reminder-Med'),
      doseTime
    });

    expect(created.response.status()).toBe(201);
    const medicineId = created.json.data.id as number;

    const dueResponse = await request.get('/api/reminders/due', {
      params: {
        now: nowIso,
        windowMinutes: '30'
      }
    });
    expect(dueResponse.status()).toBe(200);
    const dueBody = await dueResponse.json();
    const reminder = dueBody.data.find((item: { medicineId: number }) => item.medicineId === medicineId);
    expect(reminder).toBeTruthy();

    const acknowledgeResponse = await request.post(`/api/reminders/${reminder.id}/acknowledge`, {
      data: {
        acknowledgedAt: nowIso
      }
    });
    expect(acknowledgeResponse.status()).toBe(200);
    const acknowledgeBody = await acknowledgeResponse.json();
    expect(acknowledgeBody.data.status).toBe('shown');

    const dismissResponse = await request.post(`/api/reminders/${reminder.id}/dismiss`, {
      data: {
        dismissedAt: nowIso,
        reason: 'user_dismissed'
      }
    });
    expect(dismissResponse.status()).toBe(200);
    const dismissBody = await dismissResponse.json();
    expect(dismissBody.data.status).toBe('dismissed');

    const dismissAgain = await request.post(`/api/reminders/${reminder.id}/dismiss`, {
      data: {
        dismissedAt: nowIso,
        reason: 'retry'
      }
    });
    expect(dismissAgain.status()).toBe(409);
  });

  test('POST reminder actions return 404 for unknown reminder IDs', async ({ request }) => {
    const acknowledgeResponse = await request.post('/api/reminders/99999999/acknowledge', {
      data: {
        acknowledgedAt: isoNowRounded()
      }
    });
    expect(acknowledgeResponse.status()).toBe(404);

    const dismissResponse = await request.post('/api/reminders/99999999/dismiss', {
      data: {
        dismissedAt: isoNowRounded(),
        reason: 'no_event'
      }
    });
    expect(dismissResponse.status()).toBe(404);
  });
});
