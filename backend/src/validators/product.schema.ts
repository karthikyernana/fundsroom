import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150),
  sku: z.string().min(1, 'SKU is required').max(50).toUpperCase(),
  category: z.string().min(1, 'Category is required').max(80),
  unit_price: z.coerce.number().positive('Price must be positive').multipleOf(0.01),
  current_stock: z.coerce.number().int().min(0, 'Stock cannot be negative').default(0),
  min_stock_alert: z.coerce.number().int().min(0).default(10),
  location: z.string().max(100).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const stockMovementSchema = z.object({
  quantity_changed: z.coerce.number().int().positive('Quantity must be a positive integer'),
  movement_type: z.enum(['IN', 'OUT']),
  reason: z.string().max(300).optional(),
});

export const productQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  low_stock: z.preprocess(
    (val) => (val === 'true' || val === '1' ? true : val === 'false' || val === '0' ? false : val),
    z.boolean().optional()
  ),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type StockMovementInput = z.infer<typeof stockMovementSchema>;
export type ProductQuery = z.infer<typeof productQuerySchema>;
