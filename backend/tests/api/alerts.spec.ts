import { test, expect } from '@playwright/test';

test.describe('Alert Settings APIs', () => {
  test('GET /api/alert-settings returns defaults', async ({ request }) => {
    const response = await request.get('/api/alert-settings');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data).toHaveProperty('morningTime');
    expect(body.data).toHaveProperty('preAlertMinutes');
    expect(body.data).toHaveProperty('timezone');
  });

  test('PUT /api/alert-settings validates payload', async ({ request }) => {
    const response = await request.put('/api/alert-settings', {
      data: {
        morningTime: '25:00',
        noonTime: '13:00',
        eveningTime: '20:00',
        preAlertMinutes: 15,
        onTimeEnabled: true,
        timezone: 'Invalid/Zone'
      }
    });

    expect(response.status()).toBe(422);
    const body = await response.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  test('PUT /api/alert-settings updates and persists settings', async ({ request }) => {
    const updateResponse = await request.put('/api/alert-settings', {
      data: {
        morningTime: '07:30',
        noonTime: '12:45',
        eveningTime: '21:15',
        preAlertMinutes: 10,
        onTimeEnabled: true,
        timezone: 'UTC'
      }
    });

    expect(updateResponse.status()).toBe(200);
    const updateBody = await updateResponse.json();
    expect(updateBody.data.morningTime).toBe('07:30');
    expect(updateBody.meta.futureRemindersRebuilt).toBeTruthy();

    const fetchResponse = await request.get('/api/alert-settings');
    expect(fetchResponse.status()).toBe(200);
    const fetchBody = await fetchResponse.json();
    expect(fetchBody.data.morningTime).toBe('07:30');
    expect(fetchBody.data.preAlertMinutes).toBe(10);
    expect(fetchBody.data.timezone).toBe('UTC');
  });
});
