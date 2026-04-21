export type ErrorCategory = 'validation' | 'dependency' | 'internal' | 'timeout' | 'conflict' | 'not_found';

export interface ErrorDetail {
  field?: string;
  message: string;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: ErrorDetail[];
  public readonly category: ErrorCategory;

  constructor(options: {
    message: string;
    statusCode: number;
    code: string;
    category: ErrorCategory;
    details?: ErrorDetail[];
  }) {
    super(options.message);
    this.statusCode = options.statusCode;
    this.code = options.code;
    this.category = options.category;
    this.details = options.details;
  }
}

export const errorFactory = {
  validation(details: ErrorDetail[] = [], message = 'One or more fields are invalid.'): AppError {
    return new AppError({
      message,
      statusCode: 422,
      code: 'VALIDATION_ERROR',
      category: 'validation',
      details
    });
  },
  notFound(message = 'The requested resource was not found.'): AppError {
    return new AppError({
      message,
      statusCode: 404,
      code: 'NOT_FOUND',
      category: 'not_found'
    });
  },
  conflict(message: string): AppError {
    return new AppError({
      message,
      statusCode: 409,
      code: 'CONFLICT',
      category: 'conflict'
    });
  },
  dependency(message: string): AppError {
    return new AppError({
      message,
      statusCode: 502,
      code: 'DEPENDENCY_ERROR',
      category: 'dependency'
    });
  },
  internal(message = 'Internal server error.'): AppError {
    return new AppError({
      message,
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      category: 'internal'
    });
  }
};
