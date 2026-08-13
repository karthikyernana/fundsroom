import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/AppError';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
}).strict();

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

// GET /auth/sales-reps — Admin & Sales: list sales reps for customer assignment
router.get(
  '/sales-reps',
  authenticate,
  requireRole('admin', 'sales', 'warehouse', 'accounts'),
  async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const salesReps = await prisma.users.findMany({
        where: { role: { in: ['sales', 'admin'] } },
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: 'asc' },
      });
      res.status(200).json({ success: true, data: salesReps });
    } catch (err) {
      next(err);
    }
  }
);

// GET /auth/users — Admin only: list all system users
router.get(
  '/users',
  authenticate,
  requireRole('admin'),
  async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const users = await prisma.users.findMany({
        select: { id: true, name: true, email: true, role: true, created_at: true },
        orderBy: { created_at: 'asc' },
      });
      res.status(200).json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  }
);

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().toLowerCase().email('Valid email required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'sales', 'warehouse', 'accounts']),
}).strict();

// POST /auth/register — Admin only: create a new user
router.post(
  '/register',
  authenticate,
  requireRole('admin'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, email, password, role } = registerSchema.parse(req.body);

      const existing = await prisma.users.findUnique({ where: { email } });
      if (existing) {
        throw new AppError(409, 'A user with this email already exists');
      }

      const password_hash = await bcrypt.hash(password, 12);

      const user = await prisma.users.create({
        data: { name, email, password_hash, role },
        select: { id: true, name: true, email: true, role: true, created_at: true },
      });

      res.status(201).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
