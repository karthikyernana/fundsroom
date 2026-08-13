import { z } from 'zod';

const validFollowUpDateSchema = z.string().refine((val) => {
  const date = new Date(val);
  return !isNaN(date.getTime());
}, { message: 'Invalid follow-up date' });

export const createCustomerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  mobile: z.string().trim().regex(/^\d{10,15}$/, 'Mobile number must contain 10 to 15 digits'),
  email: z.string().trim().toLowerCase().email('Valid email required').optional().or(z.literal('')),
  business_name: z.string().max(150).optional(),
  gst_number: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number format').optional().or(z.literal('')),
  customer_type: z.enum(['retail', 'wholesale', 'distributor']),
  address: z.string().min(1, 'Address is required').max(300),
  status: z.enum(['lead', 'active', 'inactive']).default('lead'),
  follow_up_date: validFollowUpDateSchema
    .refine((val) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(val) >= today;
    }, { message: 'Follow-up date cannot be in the past' })
    .optional()
    .or(z.literal('')),
  notes: z.string().max(1000).optional(),
  assigned_to: z.string().uuid('Invalid assigned user ID').optional().nullable().or(z.literal('')),
}).strict();

// Existing customers can have overdue follow-ups. Editing their address or
// status must not become impossible merely because that operational date has
// passed; only new records require a future-or-today follow-up date.
export const updateCustomerSchema = createCustomerSchema
  .extend({ follow_up_date: validFollowUpDateSchema.optional().or(z.literal('')) })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });

export const addNoteSchema = z.object({
  note: z.string().trim().min(1, 'Note cannot be empty').max(1000),
}).strict();

export const customerQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['lead', 'active', 'inactive']).optional(),
  assigned_to: z.string().optional(),
  my_customers: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type AddNoteInput = z.infer<typeof addNoteSchema>;
export type CustomerQuery = z.infer<typeof customerQuerySchema>;
