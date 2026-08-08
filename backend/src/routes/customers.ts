import { Router, Response, NextFunction } from 'express';
import {
  createCustomerSchema,
  updateCustomerSchema,
  addNoteSchema,
  customerQuerySchema,
} from '../validators/customer.schema';
import {
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  addCustomerNote,
} from '../services/customer.service';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// All customer routes require auth
router.use(authenticate);

// ─── GET /customers ───────────────────────────────────────────────────────────
// Accessible: admin, sales, accounts (read-only), warehouse (read-only via product views)
router.get(
  '/',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const query = customerQuerySchema.parse(req.query);
      const result = await listCustomers(query);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /customers ──────────────────────────────────────────────────────────
// Accessible: admin, sales
router.post(
  '/',
  requireRole('admin', 'sales'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = createCustomerSchema.parse(req.body);
      const customer = await createCustomer(data);
      res.status(201).json({ success: true, data: customer });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /customers/:id ───────────────────────────────────────────────────────
router.get(
  '/:id',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const customer = await getCustomer(req.params.id);
      res.status(200).json({ success: true, data: customer });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PUT /customers/:id ───────────────────────────────────────────────────────
// Accessible: admin, sales
router.put(
  '/:id',
  requireRole('admin', 'sales'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = updateCustomerSchema.parse(req.body);
      const customer = await updateCustomer(req.params.id, data);
      res.status(200).json({ success: true, data: customer });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /customers/:id/notes ────────────────────────────────────────────────
// Accessible: admin, sales
router.post(
  '/:id/notes',
  requireRole('admin', 'sales'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = addNoteSchema.parse(req.body);
      const note = await addCustomerNote(req.params.id, data, req.user!.id);
      res.status(201).json({ success: true, data: note });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
