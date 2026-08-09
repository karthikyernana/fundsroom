import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface SalesRep {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function useSalesReps() {
  return useQuery({
    queryKey: ['salesReps'],
    queryFn: async () => {
      const res = await api.get('/auth/sales-reps');
      return res.data.data as SalesRep[];
    },
  });
}
