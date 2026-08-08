import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit_price: number;
  current_stock: number;
  min_stock_alert: number;
  location?: string;
  created_at: string;
  updated_at: string;
  _count?: { stock_movements: number; challan_items: number };
}

export interface StockMovement {
  id: string;
  quantity_changed: number;
  movement_type: 'IN' | 'OUT';
  reason?: string;
  created_at: string;
  user: { id: string; name: string; role?: string };
  product?: { id: string; name: string; sku: string; current_stock: number };
}

interface ProductListParams {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
  low_stock?: boolean;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useProducts(params: ProductListParams = {}) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const res = await api.get('/products', { params });
      return res.data as { data: Product[]; meta: { total: number; page: number; limit: number; totalPages: number } };
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: async () => {
      const res = await api.get(`/products/${id}`);
      return res.data.data as Product;
    },
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Product>) => api.post('/products', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useUpdateProduct(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Product>) => api.put(`/products/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['products', id] });
    },
  });
}

export function useStockMovements(productId: string) {
  return useQuery({
    queryKey: ['stock-movements', productId],
    queryFn: async () => {
      const res = await api.get(`/products/${productId}/stock-movements`);
      return res.data.data as { product: Product; movements: StockMovement[] };
    },
    enabled: !!productId,
  });
}

export function useAddStockMovement(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { quantity_changed: number; movement_type: 'IN' | 'OUT'; reason?: string }) =>
      api.post(`/products/${productId}/stock-movements`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['products', productId] });
      qc.invalidateQueries({ queryKey: ['stock-movements', productId] });
    },
  });
}
