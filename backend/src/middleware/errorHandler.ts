import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/AppError';

/**
 * Centralized error handler — the single place all errors flow through.
 * Maps known error types to meaningful HTTP responses.
 * Never leaks raw stack traces to the client.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Zod validation errors → 400 with field-level details
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Input validation failed',
        details: err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
    });
    return;
  }

  // AppError → the status code we explicitly set
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.statusCode === 409 ? 'CONFLICT' : err.statusCode === 404 ? 'NOT_FOUND' : err.statusCode === 403 ? 'FORBIDDEN' : err.statusCode === 401 ? 'UNAUTHORIZED' : 'BAD_REQUEST',
        message: err.message,
      },
    });
    return;
  }

  // Unknown / unexpected errors → 500, no internals exposed
  console.error('[UnhandledError]', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}
