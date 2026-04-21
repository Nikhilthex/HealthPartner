import type { LoginPayload } from './types';

export type LoginErrors = Partial<Record<keyof LoginPayload, string>>;

export function validateLoginPayload(payload: LoginPayload): LoginErrors {
  const errors: LoginErrors = {};

  if (!payload.username.trim()) {
    errors.username = 'Username is required.';
  }

  if (!payload.password) {
    errors.password = 'Password is required.';
  }

  return errors;
}
