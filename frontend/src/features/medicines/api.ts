import { apiRequest } from '../../shared/api/apiClient';
import type { DueReminder, Medicine, MedicinePayload } from './types';

export async function listMedicines() {
  const response = await apiRequest<Medicine[]>('/api/medicines');
  return response.data;
}

export async function createMedicine(payload: MedicinePayload) {
  const response = await apiRequest<Medicine>('/api/medicines', {
    method: 'POST',
    body: payload
  });
  return response.data;
}

export async function deleteMedicine(id: number) {
  await apiRequest<{ success: boolean; id: number }>(`/api/medicines/${id}`, {
    method: 'DELETE'
  });
}

export async function listDueReminders() {
  const response = await apiRequest<DueReminder[]>('/api/reminders/due?windowMinutes=15');
  return response.data;
}

export async function acknowledgeReminder(id: number) {
  const response = await apiRequest<{ id: number; status: string }>(`/api/reminders/${id}/acknowledge`, {
    method: 'POST',
    body: { acknowledgedAt: new Date().toISOString() }
  });
  return response.data;
}

export async function dismissReminder(id: number) {
  const response = await apiRequest<{ id: number; status: string }>(`/api/reminders/${id}/dismiss`, {
    method: 'POST',
    body: { dismissedAt: new Date().toISOString(), reason: 'user_dismissed' }
  });
  return response.data;
}
