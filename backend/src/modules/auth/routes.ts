import { Router } from 'express';
import { sendSuccess } from '../../shared/http/responses';
import { validateRequest } from '../../shared/http/validate';
import { getAuthenticatedUser, requireAuth } from '../../shared/user-context';
import { authenticateUser } from './service';
import { loginBodySchema } from './schemas';

export function createAuthRouter(): Router {
  const router = Router();

  router.post('/login', validateRequest({ body: loginBodySchema }), async (req, res, next) => {
    try {
      const payload = loginBodySchema.parse(req.body);
      const user = await authenticateUser(payload);

      req.session.regenerate((error) => {
        if (error) {
          next(error);
          return;
        }

        req.session.userId = user.id;
        req.session.save((saveError) => {
          if (saveError) {
            next(saveError);
            return;
          }

          sendSuccess(res, 200, { user });
        });
      });
    } catch (error) {
      return next(error);
    }
  });

  router.post('/logout', requireAuth, async (req, res, next) => {
    try {
      req.session.destroy((error) => {
        if (error) {
          next(error);
          return;
        }

        res.clearCookie('healthpartner.sid');
        sendSuccess(res, 200, { success: true });
      });
    } catch (error) {
      return next(error);
    }
  });

  router.get('/me', requireAuth, async (req, res, next) => {
    try {
      const user = getAuthenticatedUser(req);
      return sendSuccess(res, 200, { user });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
