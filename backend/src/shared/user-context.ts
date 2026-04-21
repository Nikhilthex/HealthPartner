import { env } from '../config/env';

export function getCurrentUserId(): number {
  return env.SINGLE_USER_ID;
}
