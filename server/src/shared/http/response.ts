import { Response } from "express";

export const sendSuccess = <T>(res: Response, data: T, statusCode = 200, meta?: Record<string, unknown>) => {
  const payload: { data: T; meta?: Record<string, unknown> } = { data };

  if (meta && Object.keys(meta).length > 0) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
};
