import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { AppError } from '../lib/AppError';
import { prisma } from '../lib/prisma';
import { Role } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: Role;
  };
}

const tokenPayloadSchema = z.object({
  id: z.string().min(1),
  role: z.nativeEnum(Role),
});

/**
 * Verifies JWT from the Authorization: Bearer <token> header.
 * The token signature proves identity; the user's current role is always
 * re-read from the database so role changes and deletions take effect
 * immediately instead of living for the remaining token lifetime.
 */
export async function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError(401, 'Authentication required'));
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return next(new AppError(500, 'JWT secret not configured'));
  }

  let decoded: { id: string; role: Role };
  try {
    decoded = tokenPayloadSchema.parse(jwt.verify(token, secret));
  } catch {
    next(new AppError(401, 'Invalid or expired token'));
    return;
  }

  try {
    const user = await prisma.users.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true },
    });
    if (!user) {
      return next(new AppError(401, 'Invalid or expired token'));
    }
    req.user = { id: user.id, role: user.role };
    next();
  } catch {
    next(new AppError(500, 'Authentication failed'));
  }
}

/**
 * Factory that returns middleware restricting access to specified roles.
 * Usage: router.get('/...', authenticate, requireRole('admin', 'sales'), handler)
 */
export function requireRole(...roles: Role[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'You do not have permission to perform this action'));
    }
    next();
  };
}
