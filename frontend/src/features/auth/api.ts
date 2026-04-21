import { apiRequest } from '../../shared/api/apiClient';
import type { AuthUser, LoginPayload } from './types';

export async function getCurrentUser() {
  const response = await apiRequest<{ user: AuthUser }>('/api/auth/me');
  return response.data.user;
}

export async function login(payload: LoginPayload) {
  const response = await apiRequest<{ user: AuthUser }>('/api/auth/login', {
    method: 'POST',
    body: payload
  });
  return response.data.user;
}

export async function logout() {
  await apiRequest<{ success: boolean }>('/api/auth/logout', {
    method: 'POST'
  });
}
