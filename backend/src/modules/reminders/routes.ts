import { Router } from 'express';
import { DateTime } from 'luxon';
import { validateRequest } from '../../shared/http/validate';
import { sendSuccess } from '../../shared/http/responses';
import { getAuthenticatedUserId } from '../../shared/user-context';
import {
  acknowledgeReminderBodySchema,
  dismissReminderBodySchema,
  dueRemindersQuerySchema,
  reminderIdParamsSchema
} from './schemas';
import { acknowledgeReminder, dismissReminder, getDueReminders } from './service';

export function createRemindersRouter(): Router {
  const router = Router();

  router.get('/due', validateRequest({ query: dueRemindersQuerySchema }), async (req, res, next) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const query = dueRemindersQuerySchema.parse(req.query);
      const nowIso = query.now ?? DateTime.utc().toISO();

      const result = await getDueReminders({
        userId,
        nowIso: nowIso as string,
        windowMinutes: query.windowMinutes
      });

      return sendSuccess(res, 200, result.reminders, result.meta);
    } catch (error) {
      return next(error);
    }
  });

  router.post(
    '/:id/acknowledge',
    validateRequest({ params: reminderIdParamsSchema, body: acknowledgeReminderBodySchema }),
    async (req, res, next) => {
      try {
        const result = await acknowledgeReminder({
          userId: getAuthenticatedUserId(req),
          reminderId: reminderIdParamsSchema.parse(req.params).id
        });
        return sendSuccess(res, 200, result);
      } catch (error) {
        return next(error);
      }
    }
  );

  router.post(
    '/:id/dismiss',
    validateRequest({ params: reminderIdParamsSchema, body: dismissReminderBodySchema }),
    async (req, res, next) => {
      try {
        const result = await dismissReminder({
          userId: getAuthenticatedUserId(req),
          reminderId: reminderIdParamsSchema.parse(req.params).id
        });
        return sendSuccess(res, 200, result);
      } catch (error) {
        return next(error);
      }
    }
  );

  return router;
}
