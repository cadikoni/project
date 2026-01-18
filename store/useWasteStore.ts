import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { WasteTracking } from '@/types/database';

interface WasteStats {
  totalItems: number;
  totalValue: number;
  itemsByCategory: Record<string, number>;
  itemsByReason: Record<string, number>;
  monthlyTrend: { month: string; count: number; value: number }[];
}

interface WasteState {
  wasteItems: WasteTracking[];
  stats: WasteStats | null;
  loading: boolean;
  _loadingCount: number;
  error: string | null;
  fetchWasteItems: () => Promise<void>;
  fetchStats: () => Promise<void>;
  addWasteItem: (item: Omit<WasteTracking, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  deleteWasteItem: (id: string) => Promise<void>;
}

export const useWasteStore = create<WasteState>((set, get) => ({
  wasteItems: [],
  stats: null,
  loading: false,
  _loadingCount: 0,
  error: null,

  fetchWasteItems: async () => {
    try {
      const count = get()._loadingCount + 1;
      set({ _loadingCount: count, loading: true, error: null });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('waste_tracking')
        .select(`
          *,
          category:food_categories(*)
        `)
        .eq('user_id', user.id)
        .order('wasted_date', { ascending: false });

      if (error) throw error;
      set({ wasteItems: data || [] });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchStats: async () => {
    try {
      const count = get()._loadingCount + 1;
      set({ _loadingCount: count, loading: true, error: null });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('waste_tracking')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      if (data) {
        const totalItems = data.length;
        const totalValue = data.reduce((sum, item) => sum + Number(item.estimated_value || 0), 0);

        const itemsByCategory = data.reduce((acc, item) => {
          const categoryId = item.category_id;
          acc[categoryId] = (acc[categoryId] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const itemsByReason = data.reduce((acc, item) => {
          acc[item.reason] = (acc[item.reason] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const monthlyData = data.reduce((acc, item) => {
          const month = new Date(item.wasted_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short'
          });
          const existing = acc.find(m => m.month === month);
          if (existing) {
            existing.count += 1;
            existing.value += Number(item.estimated_value || 0);
          } else {
            acc.push({
              month,
              count: 1,
              value: Number(item.estimated_value || 0)
            });
          }
          return acc;
        }, [] as { month: string; count: number; value: number }[]);

        set({
          stats: {
            totalItems,
            totalValue,
            itemsByCategory,
            itemsByReason,
            monthlyTrend: monthlyData.slice(-6).reverse(),
          },
        });
      }
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  addWasteItem: async (item) => {
    try {
      set({ loading: true, error: null });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('waste_tracking')
        .insert({ ...item, user_id: user.id })
        .select(`
          *,
          category:food_categories(*)
        `)
        .single();

      if (error) throw error;

      if (data) {
        set((state) => ({ wasteItems: [data, ...state.wasteItems] }));
        await get().fetchStats();
      }
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteWasteItem: async (id) => {
    try {
      set({ loading: true, error: null });

      const { error } = await supabase
        .from('waste_tracking')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        wasteItems: state.wasteItems.filter((item) => item.id !== id),
      }));
      await get().fetchStats();
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));
