import { z } from 'zod';
import { isValidHHmm, isValidTimezone } from '../../shared/time';

const hhmmSchema = z.string().refine(isValidHHmm, 'Time must be in HH:mm format.');
const timezoneSchema = z.string().refine(isValidTimezone, 'Timezone must be a valid IANA timezone.');

export const updateAlertSettingsSchema = z.object({
  morningTime: hhmmSchema,
  noonTime: hhmmSchema,
  eveningTime: hhmmSchema,
  preAlertMinutes: z.number().int().min(0).max(120),
  onTimeEnabled: z.boolean(),
  timezone: timezoneSchema
});

export type UpdateAlertSettingsInput = z.infer<typeof updateAlertSettingsSchema>;
