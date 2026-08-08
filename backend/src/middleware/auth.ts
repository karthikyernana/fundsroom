import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../lib/AppError';
import { Role } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: Role;
  };
}

/**
 * Verifies JWT from the Authorization: Bearer <token> header.
 * Attaches decoded user to req.user.
 */
export function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError(401, 'Authentication required'));
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return next(new AppError(500, 'JWT secret not configured'));
  }

  try {
    const decoded = jwt.verify(token, secret) as { id: string; role: Role };
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired token'));
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
