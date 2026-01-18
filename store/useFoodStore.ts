import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { FoodItem, FoodCategory } from '@/types/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FoodState {
  items: FoodItem[];
  categories: FoodCategory[];
  loading: boolean;
  _loadingCount: number;
  error: string | null;
  fetchItems: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  addItem: (item: Omit<FoodItem, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<FoodItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  syncOfflineData: () => Promise<void>;
}

const OFFLINE_ITEMS_KEY = '@food_items_offline';

export const useFoodStore = create<FoodState>((set, get) => ({
  items: [],
  categories: [],
  loading: false,
  _loadingCount: 0,
  error: null,

  fetchCategories: async () => {
    try {
      const count = get()._loadingCount + 1;
      set({ _loadingCount: count, loading: true, error: null });

      const cached = await AsyncStorage.getItem('@food_categories');
      if (cached) {
        set({ categories: JSON.parse(cached) });
      }

      const { data, error } = await supabase
        .from('food_categories')
        .select('*')
        .order('name');

      if (error) throw error;

      if (data) {
        set({ categories: data });
        await AsyncStorage.setItem('@food_categories', JSON.stringify(data));
      }
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      set({ error: error.message });
    } finally {
      const count = Math.max(0, get()._loadingCount - 1);
      set({ _loadingCount: count, loading: count > 0 });
    }
  },

  fetchItems: async () => {
    try {
      const count = get()._loadingCount + 1;
      set({ _loadingCount: count, loading: true, error: null });

      const cached = await AsyncStorage.getItem('@food_items');
      if (cached) {
        set({ items: JSON.parse(cached) });
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('food_items')
        .select(`
          *,
          category:food_categories(*)
        `)
        .eq('user_id', user.id)
        .order('expiration_date', { ascending: true });

      if (error) throw error;

      if (data) {
        set({ items: data });
        await AsyncStorage.setItem('@food_items', JSON.stringify(data));
      }
    } catch (error: any) {
      console.error('Error fetching items:', error);
      set({ error: error.message });

      const cached = await AsyncStorage.getItem('@food_items');
      if (cached) {
        set({ items: JSON.parse(cached) });
      }
    } finally {
      const count = Math.max(0, get()._loadingCount - 1);
      set({ _loadingCount: count, loading: count > 0 });
    }
  },

  addItem: async (item) => {
    try {
      set({ loading: true, error: null });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const newItem = { ...item, user_id: user.id };

      const { data, error } = await supabase
        .from('food_items')
        .insert(newItem)
        .select(`
          *,
          category:food_categories(*)
        `)
        .single();

      if (error) throw error;

      if (data) {
        set((state) => ({ items: [data, ...state.items] }));
        await AsyncStorage.setItem('@food_items', JSON.stringify([data, ...get().items]));
      }
    } catch (error: any) {
      set({ error: error.message });

      const offlineItems = await AsyncStorage.getItem(OFFLINE_ITEMS_KEY);
      const pending = offlineItems ? JSON.parse(offlineItems) : [];
      pending.push({ ...item, offline: true, timestamp: Date.now() });
      await AsyncStorage.setItem(OFFLINE_ITEMS_KEY, JSON.stringify(pending));

      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateItem: async (id, updates) => {
    try {
      set({ loading: true, error: null });

      const { data, error } = await supabase
        .from('food_items')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          category:food_categories(*)
        `)
        .single();

      if (error) throw error;

      if (data) {
        set((state) => ({
          items: state.items.map((item) => (item.id === id ? data : item)),
        }));
        await AsyncStorage.setItem('@food_items', JSON.stringify(get().items));
      }
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteItem: async (id) => {
    try {
      set({ loading: true, error: null });

      const { error } = await supabase
        .from('food_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
      }));
      await AsyncStorage.setItem('@food_items', JSON.stringify(get().items));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  syncOfflineData: async () => {
    try {
      const offlineItems = await AsyncStorage.getItem(OFFLINE_ITEMS_KEY);
      if (!offlineItems) return;

      const pending = JSON.parse(offlineItems);
      if (pending.length === 0) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      for (const item of pending) {
        const { offline, timestamp, ...itemData } = item;
        await get().addItem(itemData);
      }

      await AsyncStorage.removeItem(OFFLINE_ITEMS_KEY);
    } catch (error: any) {
      console.error('Error syncing offline data:', error);
    }
  },
}));
