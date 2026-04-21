import { z } from 'zod';

export const reminderIdParamsSchema = z.object({
  id: z.coerce.number().int().positive()
});

export const dueRemindersQuerySchema = z.object({
  now: z.string().datetime().optional(),
  windowMinutes: z.coerce.number().int().positive().max(120).optional().default(15)
});

export const acknowledgeReminderBodySchema = z.object({
  acknowledgedAt: z.string().datetime().optional()
});

export const dismissReminderBodySchema = z.object({
  dismissedAt: z.string().datetime().optional(),
  reason: z.string().min(1).max(120).optional()
});
