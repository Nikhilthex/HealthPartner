import type { Response } from 'express';

export function sendSuccess<T>(res: Response, statusCode: number, data: T, meta?: Record<string, unknown>): Response {
  if (meta) {
    return res.status(statusCode).json({ data, meta });
  }
  return res.status(statusCode).json({ data });
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: Array<{ field?: string; message: string }>
): Response {
  return res.status(statusCode).json({
    error: {
      code,
      message,
      ...(details && details.length > 0 ? { details } : {})
    }
  });
}
