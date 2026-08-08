import { Router, Response, NextFunction } from 'express';
import {
  createChallanSchema,
  updateChallanSchema,
  challanQuerySchema,
} from '../validators/challan.schema';
import {
  listChallans,
  getChallan,
  createChallan,
  updateChallan,
  confirmChallan,
  cancelChallan,
} from '../services/challan.service';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// ─── GET /challans ────────────────────────────────────────────────────────────
// Accessible: all roles
router.get(
  '/',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const query = challanQuerySchema.parse(req.query);
      const result = await listChallans(query);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /challans ───────────────────────────────────────────────────────────
// Accessible: admin, sales, warehouse
router.post(
  '/',
  requireRole('admin', 'sales', 'warehouse'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = createChallanSchema.parse(req.body);
      const challan = await createChallan(data, req.user!.id);
      res.status(201).json({ success: true, data: challan });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /challans/:id ────────────────────────────────────────────────────────
router.get(
  '/:id',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const challan = await getChallan(req.params.id);
      res.status(200).json({ success: true, data: challan });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PUT /challans/:id ────────────────────────────────────────────────────────
// Accessible: admin, sales, warehouse — only while status=draft
router.put(
  '/:id',
  requireRole('admin', 'sales', 'warehouse'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = updateChallanSchema.parse(req.body);
      const challan = await updateChallan(req.params.id, data);
      res.status(200).json({ success: true, data: challan });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /challans/:id/confirm ───────────────────────────────────────────────
// The §5 critical transaction — admin, sales, warehouse
router.post(
  '/:id/confirm',
  requireRole('admin', 'sales', 'warehouse'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const challan = await confirmChallan(req.params.id, req.user!.id);
      res.status(200).json({ success: true, data: challan });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /challans/:id/cancel ────────────────────────────────────────────────
// Accessible: admin, warehouse
router.post(
  '/:id/cancel',
  requireRole('admin', 'warehouse'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const challan = await cancelChallan(req.params.id);
      res.status(200).json({ success: true, data: challan });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
