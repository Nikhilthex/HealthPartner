import express from 'express';
import session from 'express-session';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { correlationIdMiddleware } from './shared/middleware/correlation-id';
import { errorHandler, notFoundHandler } from './shared/middleware/error-handler';
import { requestLogger } from './shared/logger';
import { sendSuccess } from './shared/http/responses';
import { createAuthRouter } from './modules/auth/routes';
import { createMedicinesRouter } from './modules/medicines/routes';
import { createAlertSettingsRouter } from './modules/alerts/routes';
import { createRemindersRouter } from './modules/reminders/routes';
import { createReportsRouter } from './modules/reports/routes';
import { openApiDocument } from './docs/openapi';
import { requireAuth } from './shared/user-context';

export function createApp(): express.Express {
  const app = express();

  app.use(correlationIdMiddleware);
  app.use(express.json());
  app.use(
    session({
      name: 'healthpartner.sid',
      secret: env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24
      }
    })
  );
  app.use(requestLogger);

  app.get('/api/health', (_req, res) => sendSuccess(res, 200, { status: 'ok' }));
  app.get('/api/openapi.json', (_req, res) => res.status(200).json(openApiDocument));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
  app.use('/api/auth', createAuthRouter());

  app.use('/api/medicines', requireAuth, createMedicinesRouter());
  app.use('/api/alert-settings', requireAuth, createAlertSettingsRouter());
  app.use('/api/reminders', requireAuth, createRemindersRouter());
  app.use('/api/reports', requireAuth, createReportsRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
