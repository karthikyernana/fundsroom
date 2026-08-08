import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/AppError';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const loginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
});

// POST /auth/login
router.post(
  '/login',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const user = await prisma.users.findUnique({ where: { email } });

      if (!user) {
        throw new AppError(401, 'Invalid email or password');
      }

      const passwordMatch = await bcrypt.compare(password, user.password_hash);

      if (!passwordMatch) {
        throw new AppError(401, 'Invalid email or password');
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) throw new AppError(500, 'JWT secret not configured');

      const token = jwt.sign(
        { id: user.id, role: user.role },
        secret,
        { expiresIn: '24h' }
      );

      res.status(200).json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /auth/me
router.get(
  '/me',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await prisma.users.findUnique({
        where: { id: req.user!.id },
        select: { id: true, name: true, email: true, role: true, created_at: true },
      });

      if (!user) throw new AppError(404, 'User not found');

      res.status(200).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
