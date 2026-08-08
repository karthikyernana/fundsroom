import { Router, Response, NextFunction } from 'express';
import {
  createProductSchema,
  updateProductSchema,
  stockMovementSchema,
  productQuerySchema,
} from '../validators/product.schema';
import {
  listProducts,
  getProduct,
  createProductWithUser,
  updateProduct,
  addStockMovement,
  getStockMovements,
} from '../services/product.service';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// ─── GET /products ────────────────────────────────────────────────────────────
// Accessible: all authenticated roles (accounts in read-only mode)
router.get(
  '/',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const query = productQuerySchema.parse(req.query);
      const result = await listProducts(query);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /products ───────────────────────────────────────────────────────────
// Accessible: admin, warehouse
router.post(
  '/',
  requireRole('admin', 'warehouse'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = createProductSchema.parse(req.body);
      const product = await createProductWithUser(data, req.user!.id);
      res.status(201).json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /products/:id ────────────────────────────────────────────────────────
router.get(
  '/:id',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const product = await getProduct(req.params.id);
      res.status(200).json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PUT /products/:id ────────────────────────────────────────────────────────
// Accessible: admin, warehouse
// Note: current_stock is intentionally not editable here — use stock-movements
router.put(
  '/:id',
  requireRole('admin', 'warehouse'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = updateProductSchema.parse(req.body);
      const product = await updateProduct(req.params.id, data);
      res.status(200).json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /products/:id/stock-movements ───────────────────────────────────────
// Accessible: admin, warehouse
router.post(
  '/:id/stock-movements',
  requireRole('admin', 'warehouse'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = stockMovementSchema.parse(req.body);
      const movement = await addStockMovement(req.params.id, data, req.user!.id);
      res.status(201).json({ success: true, data: movement });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /products/:id/stock-movements ───────────────────────────────────────
// Accessible: all authenticated roles
router.get(
  '/:id/stock-movements',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await getStockMovements(req.params.id);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
