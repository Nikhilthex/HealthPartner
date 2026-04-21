import { z, ZodError } from "zod";

import { AppError, ErrorDetail } from "../errors";

const formatIssues = (error: ZodError): ErrorDetail[] =>
  error.issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join(".") : undefined,
    message: issue.message
  }));

export const parseSchema = <T>(schema: z.ZodSchema<T>, payload: unknown): T => {
  const result = schema.safeParse(payload);

  if (!result.success) {
    throw new AppError(422, "VALIDATION_ERROR", "One or more fields are invalid.", formatIssues(result.error));
  }

  return result.data;
};
