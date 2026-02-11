/**
 * Error Handler Middleware
 * Centralized error handling with consistent response format
 */

import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

// Custom error classes
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(404, id ? `${resource} with id ${id} not found` : `${resource} not found`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, message, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

// Error response format
interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

// Format Zod validation errors
function formatZodError(error: ZodError): string {
  return error.errors
    .map((e) => `${e.path.join('.')}: ${e.message}`)
    .join('; ');
}

// Error handler middleware
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', err);

  let response: ErrorResponse;
  let statusCode: number;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    response = {
      error: {
        message: err.message,
        code: err.code,
      },
    };
  } else if (err instanceof ZodError) {
    statusCode = 400;
    response = {
      error: {
        message: formatZodError(err),
        code: 'VALIDATION_ERROR',
        details: err.errors,
      },
    };
  } else if (err.message?.includes('duplicate key')) {
    statusCode = 409;
    response = {
      error: {
        message: 'Resource already exists',
        code: 'DUPLICATE',
      },
    };
  } else if (err.message?.includes('violates foreign key')) {
    statusCode = 400;
    response = {
      error: {
        message: 'Referenced resource does not exist',
        code: 'FOREIGN_KEY_VIOLATION',
      },
    };
  } else {
    // Unknown error - don't leak details in production
    statusCode = 500;
    response = {
      error: {
        message: process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : err.message,
        code: 'INTERNAL_ERROR',
      },
    };
  }

  res.status(statusCode).json(response);
}

// Async handler wrapper to catch promise rejections
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function asyncHandler<Req = any, T = void>(
  fn: (req: Req, res: Response, next: NextFunction) => Promise<T>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req as Req, res, next)).catch(next);
  };
}

// Not found handler for unmatched routes
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    error: {
      message: 'Route not found',
      code: 'ROUTE_NOT_FOUND',
    },
  });
}
