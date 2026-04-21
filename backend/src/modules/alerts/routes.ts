import { Router } from 'express';
import { validateRequest } from '../../shared/http/validate';
import { sendSuccess } from '../../shared/http/responses';
import { getCurrentUserId } from '../../shared/user-context';
import { updateAlertSettingsSchema } from './schemas';
import { getAlertSettings, updateAlertSettings } from './service';

export function createAlertSettingsRouter(): Router {
  const router = Router();

  router.get('/', async (_req, res, next) => {
    try {
      const result = await getAlertSettings(getCurrentUserId());
      return sendSuccess(res, 200, result);
    } catch (error) {
      return next(error);
    }
  });

  router.put('/', validateRequest({ body: updateAlertSettingsSchema }), async (req, res, next) => {
    try {
      const payload = updateAlertSettingsSchema.parse(req.body);
      const result = await updateAlertSettings(getCurrentUserId(), payload);
      return sendSuccess(res, 200, result.settings, {
        futureRemindersRebuilt: result.futureRemindersRebuilt
      });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
