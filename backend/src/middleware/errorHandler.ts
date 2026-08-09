import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/AppError';
import { Prisma } from '@prisma/client';

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
    const code =
      err.statusCode === 409 ? 'CONFLICT' :
      err.statusCode === 404 ? 'NOT_FOUND' :
      err.statusCode === 403 ? 'FORBIDDEN' :
      err.statusCode === 401 ? 'UNAUTHORIZED' :
      err.statusCode >= 500  ? 'SERVER_ERROR' :
      'BAD_REQUEST';
    res.status(err.statusCode).json({
      success: false,
      error: { code, message: err.message },
    });
    return;
  }

  // Prisma known errors — map to HTTP codes
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      // Unique constraint violation (e.g. duplicate challan_number, duplicate SKU)
      const fields = Array.isArray(err.meta?.target) ? (err.meta!.target as string[]).join(', ') : 'field';
      res.status(409).json({
        success: false,
        error: { code: 'CONFLICT', message: `A record with that ${fields} already exists. Please retry.` },
      });
      return;
    }
    if (err.code === 'P2025') {
      // Record not found (deleteMany on non-existent, etc.)
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Record not found' },
      });
      return;
    }
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
