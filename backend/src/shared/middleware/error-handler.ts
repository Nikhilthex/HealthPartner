import type { NextFunction, Request, Response } from 'express';
import { AppError, errorFactory } from '../errors';
import { sendError } from '../http/responses';
import { logger } from '../logger';

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction): void {
  next(errorFactory.notFound());
}

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction): Response {
  const correlationId = req.correlationId;

  if (error instanceof AppError) {
    logger.warn('request_failed', {
      correlationId,
      code: error.code,
      category: error.category,
      message: error.message
    });
    return sendError(res, error.statusCode, error.code, error.message, error.details);
  }

  logger.error('request_crashed', {
    correlationId,
    error: error instanceof Error ? error.message : 'unknown_error'
  });

  return sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error.');
}
