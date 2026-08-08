import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  mobile: z.string().min(10, 'Valid mobile number required').max(15),
  email: z.string().email('Valid email required').optional().or(z.literal('')),
  business_name: z.string().max(150).optional(),
  gst_number: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number format').optional().or(z.literal('')),
  customer_type: z.enum(['retail', 'wholesale', 'distributor']),
  address: z.string().min(1, 'Address is required').max(300),
  status: z.enum(['lead', 'active', 'inactive']).default('lead'),
  follow_up_date: z.string()
    .refine((val) => {
      if (!val) return true;
      const date = new Date(val);
      if (isNaN(date.getTime())) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    }, { message: 'Follow-up date cannot be in the past' })
    .optional()
    .or(z.literal('')),
  notes: z.string().max(1000).optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const addNoteSchema = z.object({
  note: z.string().min(1, 'Note cannot be empty').max(1000),
});

export const customerQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['lead', 'active', 'inactive']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type AddNoteInput = z.infer<typeof addNoteSchema>;
export type CustomerQuery = z.infer<typeof customerQuerySchema>;
