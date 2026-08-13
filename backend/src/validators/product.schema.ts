import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(150),
  sku: z.string().trim().min(1, 'SKU is required').max(50).toUpperCase(),
  category: z.string().trim().min(1, 'Category is required').max(80),
  unit_price: z.coerce.number().positive('Price must be positive').max(9_999_999_999.99).multipleOf(0.01),
  current_stock: z.coerce.number().int().min(0, 'Stock cannot be negative').max(2_147_483_647).default(0),
  min_stock_alert: z.coerce.number().int().min(0).max(2_147_483_647).default(10),
  location: z.string().max(100).optional(),
}).strict();

// Stock is intentionally absent here: accepting and then silently ignoring it
// would report a successful update without applying the caller's change.
export const updateProductSchema = createProductSchema
  .omit({ current_stock: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });

export const stockMovementSchema = z.object({
  quantity_changed: z.coerce.number().int().positive('Quantity must be a positive integer').max(2_147_483_647),
  movement_type: z.enum(['IN', 'OUT']),
  reason: z.string().max(300).optional(),
}).strict();

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
