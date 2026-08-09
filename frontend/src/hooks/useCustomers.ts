import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  business_name?: string;
  gst_number?: string;
  customer_type: 'retail' | 'wholesale' | 'distributor';
  address: string;
  status: 'lead' | 'active' | 'inactive';
  follow_up_date?: string;
  notes?: string;
  assigned_to?: string | null;
  assigned_salesperson?: { id: string; name: string; email: string } | null;
  created_at: string;
  updated_at: string;
  _count?: { customer_notes: number; challans: number };
  customer_notes?: CustomerNote[];
}

export interface CustomerNote {
  id: string;
  note: string;
  created_at: string;
  user: { id: string; name: string; role: string };
}

interface CustomerListParams {
  search?: string;
  status?: string;
  assigned_to?: string;
  my_customers?: boolean;
  page?: number;
  limit?: number;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useCustomers(params: CustomerListParams = {}) {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: async () => {
      const res = await api.get('/customers', { params });
      return res.data as { data: Customer[]; meta: { total: number; page: number; limit: number; totalPages: number } };
    },
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: async () => {
      const res = await api.get(`/customers/${id}`);
      return res.data.data as Customer;
    },
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Customer>) => api.post('/customers', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
}

export function useUpdateCustomer(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Customer>) => api.put(`/customers/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['customers', id] });
    },
  });
}

export function useAddCustomerNote(customerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (note: string) => api.post(`/customers/${customerId}/notes`, { note }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers', customerId] }),
  });
}
