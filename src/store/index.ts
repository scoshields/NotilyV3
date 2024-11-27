import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { ensureUserRecord } from '../lib/database-init';
import type { User } from '@supabase/supabase-js';

interface StoreState {
  user: User | null;
  isInitialized: boolean;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
  setUser: (user: User | null) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  user: null,
  isInitialized: false,
  isLoading: true,
  
  setIsLoading: (loading: boolean) => set({ isLoading: loading }),

  initialize: async () => {
    try {
      set({ isLoading: true });
      set({ isInitialized: true, isLoading: false });
    } catch (error) {
      console.error('Error initializing store:', error);
      await supabase.auth.signOut();
      set({ user: null, isInitialized: true, isLoading: false });
    }
  },

  setUser: async (user) => {
    try {
      if (user) {
        await ensureUserRecord(user.id, user.email || '');
      }
      set({ user });
    } catch (error) {
      console.error('Error setting user:', error);
      throw error;
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true });
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      set({ 
        user: null,
        isInitialized: true,
        isLoading: false
      });
      
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
      set({ isLoading: false });
      throw error;
    }
  }
}));