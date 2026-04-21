import type { NextFunction, Request, Response } from 'express';
import type { AnyZodObject, ZodTypeAny } from 'zod';
import { errorFactory } from '../errors';

type ValidationSchemas = {
  body?: ZodTypeAny;
  query?: AnyZodObject;
  params?: AnyZodObject;
};

function formatZodIssues(error: { issues: Array<{ path: Array<string | number>; message: string }> }): Array<{ field?: string; message: string }> {
  return error.issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join('.') : undefined,
    message: issue.message
  }));
}

export function validateRequest(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.params) {
        const parsed = schemas.params.safeParse(req.params);
        if (!parsed.success) {
          throw errorFactory.validation(formatZodIssues(parsed.error));
        }
        req.params = parsed.data as Request['params'];
      }

      if (schemas.query) {
        const parsed = schemas.query.safeParse(req.query);
        if (!parsed.success) {
          throw errorFactory.validation(formatZodIssues(parsed.error));
        }
        req.query = parsed.data as Request['query'];
      }

      if (schemas.body) {
        const parsed = schemas.body.safeParse(req.body);
        if (!parsed.success) {
          throw errorFactory.validation(formatZodIssues(parsed.error));
        }
        req.body = parsed.data;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
