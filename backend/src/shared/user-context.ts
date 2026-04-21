import type { NextFunction, Request, Response } from 'express';
import { AppError } from './errors';
import { getUserById } from '../modules/auth/service';

export function getAuthenticatedUser(req: Request): { id: number; username: string } {
  if (!req.authUser) {
    throw new AppError({
      statusCode: 401,
      code: 'UNAUTHORIZED',
      category: 'validation',
      message: 'Authentication is required.'
    });
  }

  return req.authUser;
}

export function getAuthenticatedUserId(req: Request): number {
  return getAuthenticatedUser(req).id;
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.session.userId;

    if (!userId) {
      throw new AppError({
        statusCode: 401,
        code: 'UNAUTHORIZED',
        category: 'validation',
        message: 'Authentication is required.'
      });
    }

    req.authUser = await getUserById(userId);
    next();
  } catch (error) {
    next(error);
  }
}
