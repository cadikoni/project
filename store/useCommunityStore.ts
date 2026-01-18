import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { CommunityShare } from '@/types/database';

interface CommunityState {
  shares: CommunityShare[];
  myShares: CommunityShare[];
  claimedShares: CommunityShare[];
  loading: boolean;
  _loadingCount: number;
  error: string | null;
  fetchShares: () => Promise<void>;
  fetchMyShares: () => Promise<void>;
  fetchClaimedShares: () => Promise<void>;
  createShare: (share: Omit<CommunityShare, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'status'>) => Promise<void>;
  claimShare: (id: string) => Promise<void>;
  completeShare: (id: string) => Promise<void>;
  cancelShare: (id: string) => Promise<void>;
}

export const useCommunityStore = create<CommunityState>((set, get) => ({
  shares: [],
  myShares: [],
  claimedShares: [],
  loading: false,
  _loadingCount: 0,
  error: null,

  fetchShares: async () => {
    try {
      const count = get()._loadingCount + 1;
      set({ _loadingCount: count, loading: true, error: null });

      const { data, error } = await supabase
        .from('community_shares')
        .select(`
          *,
          profile:profiles!community_shares_user_id_fkey(
            id,
            full_name,
            avatar_url,
            location
          )
        `)
        .eq('status', 'available')
        .gte('available_until', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ shares: data || [] });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchMyShares: async () => {
    try {
      set({ loading: true, error: null });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('community_shares')
        .select(`
          *,
          profile:profiles!community_shares_user_id_fkey(
            id,
            full_name,
            avatar_url,
            location
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ myShares: data || [] });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchClaimedShares: async () => {
    try {
      set({ loading: true, error: null });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('community_shares')
        .select(`
          *,
          profile:profiles!community_shares_user_id_fkey(
            id,
            full_name,
            avatar_url,
            location
          )
        `)
        .eq('claimed_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ claimedShares: data || [] });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  createShare: async (share) => {
    try {
      set({ loading: true, error: null });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('community_shares')
        .insert({
          ...share,
          user_id: user.id,
          status: 'available',
        })
        .select(`
          *,
          profile:profiles!community_shares_user_id_fkey(
            id,
            full_name,
            avatar_url,
            location
          )
        `)
        .single();

      if (error) throw error;

      if (data) {
        set((state) => ({
          shares: [data, ...state.shares],
          myShares: [data, ...state.myShares],
        }));
      }
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  claimShare: async (id) => {
    try {
      set({ loading: true, error: null });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('community_shares')
        .update({
          status: 'claimed',
          claimed_by: user.id,
        })
        .eq('id', id)
        .select(`
          *,
          profile:profiles!community_shares_user_id_fkey(
            id,
            full_name,
            avatar_url,
            location
          )
        `)
        .single();

      if (error) throw error;

      if (data) {
        set((state) => ({
          shares: state.shares.filter((share) => share.id !== id),
          claimedShares: [data, ...state.claimedShares],
        }));
      }
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  completeShare: async (id) => {
    try {
      set({ loading: true, error: null });

      const { error } = await supabase
        .from('community_shares')
        .update({ status: 'completed' })
        .eq('id', id);

      if (error) throw error;

      await Promise.all([
        get().fetchMyShares(),
        get().fetchClaimedShares(),
      ]);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  cancelShare: async (id) => {
    try {
      set({ loading: true, error: null });

      const { error } = await supabase
        .from('community_shares')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        shares: state.shares.filter((share) => share.id !== id),
        myShares: state.myShares.filter((share) => share.id !== id),
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));
