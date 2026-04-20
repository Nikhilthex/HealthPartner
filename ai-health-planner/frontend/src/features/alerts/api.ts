import { apiRequest } from '../../shared/api/apiClient';
import type { AlertSettings } from './types';

export async function getAlertSettings() {
  const response = await apiRequest<AlertSettings>('/api/alert-settings');
  return response.data;
}

export async function updateAlertSettings(payload: AlertSettings) {
  const response = await apiRequest<AlertSettings>('/api/alert-settings', {
    method: 'PUT',
    body: payload
  });
  return response;
}
