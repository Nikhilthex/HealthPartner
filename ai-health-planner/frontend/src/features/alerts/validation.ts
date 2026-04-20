import type { AlertSettings } from './types';

export type AlertSettingsErrors = Partial<Record<keyof AlertSettings, string>>;

export function validateAlertSettings(settings: AlertSettings): AlertSettingsErrors {
  const errors: AlertSettingsErrors = {};

  if (!isTime(settings.morningTime)) {
    errors.morningTime = 'Enter a valid morning time.';
  }
  if (!isTime(settings.noonTime)) {
    errors.noonTime = 'Enter a valid noon time.';
  }
  if (!isTime(settings.eveningTime)) {
    errors.eveningTime = 'Enter a valid evening time.';
  }
  if (!Number.isInteger(settings.preAlertMinutes) || settings.preAlertMinutes < 0 || settings.preAlertMinutes > 240) {
    errors.preAlertMinutes = 'Use a whole number from 0 to 240.';
  }
  if (!/^[A-Za-z_]+\/[A-Za-z_]+(?:\/[A-Za-z_]+)?$/.test(settings.timezone)) {
    errors.timezone = 'Use an IANA timezone such as Asia/Kolkata.';
  }

  return errors;
}

function isTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}
