import { z } from 'zod';

export const challanItemSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  quantity: z.coerce.number().int().positive('Quantity must be a positive integer'),
});

export const createChallanSchema = z.object({
  customer_id: z.string().uuid('Invalid customer ID'),
  items: z.array(challanItemSchema).min(1, 'Challan must have at least one item'),
}).strict();

export const updateChallanSchema = z.object({
  customer_id: z.string().uuid().optional(),
  items: z.array(challanItemSchema).min(1).optional(),
}).strict().refine((data) => data.customer_id !== undefined || data.items !== undefined, {
  message: 'Provide at least one field to update',
});

export const challanQuerySchema = z.object({
  status: z.enum(['draft', 'confirmed', 'cancelled']).optional(),
  customer: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateChallanInput = z.infer<typeof createChallanSchema>;
export type UpdateChallanInput = z.infer<typeof updateChallanSchema>;
export type ChallanQuery = z.infer<typeof challanQuerySchema>;
