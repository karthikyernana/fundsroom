import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Customer } from './useCustomers';
import type { Product } from './useProducts';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ChallanItem {
  id: string;
  product_id: string;
  product_name_snapshot: string;
  product_sku_snapshot: string;
  unit_price_snapshot: number;
  quantity: number;
  subtotal: number;
  product?: Pick<Product, 'id' | 'current_stock'>;
}

export interface Challan {
  id: string;
  challan_number: string;
  customer_id: string;
  status: 'draft' | 'confirmed' | 'cancelled';
  total_quantity: number;
  created_at: string;
  customer?: Pick<Customer, 'id' | 'name' | 'business_name'>;
  creator?: { id: string; name: string };
  challan_items?: ChallanItem[];
  _count?: { challan_items: number };
}

interface ChallanListParams {
  status?: string;
  customer?: string;
  page?: number;
  limit?: number;
}

interface CreateChallanPayload {
  customer_id: string;
  items: { product_id: string; quantity: number }[];
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useChallans(params: ChallanListParams = {}) {
  return useQuery({
    queryKey: ['challans', params],
    queryFn: async () => {
      const res = await api.get('/challans', { params });
      return res.data as { data: Challan[]; meta: { total: number; page: number; limit: number; totalPages: number } };
    },
  });
}

export function useChallan(id: string) {
  return useQuery({
    queryKey: ['challans', id],
    queryFn: async () => {
      const res = await api.get(`/challans/${id}`);
      return res.data.data as Challan;
    },
    enabled: !!id,
  });
}

export function useCreateChallan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateChallanPayload) => api.post('/challans', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['challans'] }),
  });
}

export function useUpdateChallan(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CreateChallanPayload>) => api.put(`/challans/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['challans'] });
      qc.invalidateQueries({ queryKey: ['challans', id] });
    },
  });
}

export function useConfirmChallan(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(`/challans/${id}/confirm`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['challans'] });
      qc.invalidateQueries({ queryKey: ['challans', id] });
      // Stock has changed — invalidate products cache too
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useCancelChallan(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(`/challans/${id}/cancel`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['challans'] });
      qc.invalidateQueries({ queryKey: ['challans', id] });
    },
  });
}
