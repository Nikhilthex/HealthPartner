import express from 'express';
import { correlationIdMiddleware } from './shared/middleware/correlation-id';
import { errorHandler, notFoundHandler } from './shared/middleware/error-handler';
import { requestLogger } from './shared/logger';
import { sendSuccess } from './shared/http/responses';
import { createMedicinesRouter } from './modules/medicines/routes';
import { createAlertSettingsRouter } from './modules/alerts/routes';
import { createRemindersRouter } from './modules/reminders/routes';
import { createReportsRouter } from './modules/reports/routes';

export function createApp(): express.Express {
  const app = express();

  app.use(correlationIdMiddleware);
  app.use(express.json());
  app.use(requestLogger);

  app.get('/api/health', (_req, res) => sendSuccess(res, 200, { status: 'ok' }));

  app.use('/api/medicines', createMedicinesRouter());
  app.use('/api/alert-settings', createAlertSettingsRouter());
  app.use('/api/reminders', createRemindersRouter());
  app.use('/api/reports', createReportsRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
