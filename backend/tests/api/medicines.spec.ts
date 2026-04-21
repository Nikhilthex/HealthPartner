import { test, expect } from '@playwright/test';
import { DateTime } from 'luxon';
import { createMedicineForTest, isoNowRounded, uniqueName } from './helpers';

test.describe('Medicines APIs', () => {
  test('POST /api/medicines returns validation error for invalid schedules', async ({ request }) => {
    const response = await request.post('/api/medicines', {
      data: {
        rxName: 'Invalid Medicine',
        daysOfSupply: 30,
        totalAvailableQty: 60,
        schedules: [
          {
            slot: 'morning',
            enabled: false,
            doseTime: '08:00',
            qty: 0
          }
        ]
      }
    });

    expect(response.status()).toBe(422);
    const body = await response.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  test('POST, GET and GET list work for medicines', async ({ request }) => {
    const created = await createMedicineForTest(request, { rxName: uniqueName('Metformin') });
    expect(created.response.status()).toBe(201);
    const createdId = created.json.data.id as number;

    const getResponse = await request.get(`/api/medicines/${createdId}`);
    expect(getResponse.status()).toBe(200);
    const getBody = await getResponse.json();
    expect(getBody.data.id).toBe(createdId);
    expect(getBody.data.rxName).toBe(created.payload.rxName);

    const listResponse = await request.get('/api/medicines');
    expect(listResponse.status()).toBe(200);
    const listBody = await listResponse.json();
    expect(Array.isArray(listBody.data)).toBeTruthy();
    expect(listBody.data.some((item: { id: number }) => item.id === createdId)).toBeTruthy();
  });

  test('GET /api/medicines/:id returns 404 for unknown medicine', async ({ request }) => {
    const response = await request.get('/api/medicines/99999999');
    expect(response.status()).toBe(404);
  });

  test('PUT /api/medicines/:id updates medicine details', async ({ request }) => {
    const created = await createMedicineForTest(request);
    const id = created.json.data.id as number;

    const response = await request.put(`/api/medicines/${id}`, {
      data: {
        rxName: uniqueName('Updated-Medicine'),
        daysOfSupply: 45,
        totalAvailableQty: 90,
        remainingQty: 50,
        notes: 'Updated notes',
        schedules: [
          {
            slot: 'morning',
            enabled: true,
            doseTime: '07:30',
            qty: 1
          },
          {
            slot: 'evening',
            enabled: true,
            doseTime: '20:30',
            qty: 1
          }
        ]
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data.daysOfSupply).toBe(45);
    expect(body.data.totalAvailableQty).toBe(90);
    expect(body.data.remainingQty).toBe(50);
  });

  test('POST /api/medicines/:id/intake updates stock and reminder state', async ({ request }) => {
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
      rxName: uniqueName('Intake-Med'),
      doseTime
    });
    const medicineId = created.json.data.id as number;

    const dueResponse = await request.get('/api/reminders/due', {
      params: {
        now: nowIso,
        windowMinutes: '30'
      }
    });
    expect(dueResponse.status()).toBe(200);
    const dueBody = await dueResponse.json();
    const reminder = dueBody.data.find((item: { medicineId: number; alertType: string }) => item.medicineId === medicineId && item.alertType === 'pre');
    expect(reminder).toBeTruthy();

    const intakeResponse = await request.post(`/api/medicines/${medicineId}/intake`, {
      data: {
        reminderEventId: reminder.id,
        qtyTaken: 1,
        takenAt: nowIso
      }
    });
    expect(intakeResponse.status()).toBe(200);
    const intakeBody = await intakeResponse.json();
    expect(intakeBody.data.medicineId).toBe(medicineId);
    expect(intakeBody.data.reminderStatus).toBe('taken');

    const validationFailure = await request.post(`/api/medicines/${medicineId}/intake`, {
      data: {
        reminderEventId: reminder.id,
        qtyTaken: 1
      }
    });
    expect(validationFailure.status()).toBe(422);
  });

  test('DELETE /api/medicines/:id archives medicine', async ({ request }) => {
    const created = await createMedicineForTest(request);
    const id = created.json.data.id as number;

    const response = await request.delete(`/api/medicines/${id}`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data.success).toBeTruthy();

    const listActive = await request.get('/api/medicines');
    const activeBody = await listActive.json();
    expect(activeBody.data.some((item: { id: number }) => item.id === id)).toBeFalsy();

    const listAll = await request.get('/api/medicines', {
      params: { includeInactive: 'true' }
    });
    const allBody = await listAll.json();
    expect(allBody.data.some((item: { id: number }) => item.id === id)).toBeTruthy();
  });
});
