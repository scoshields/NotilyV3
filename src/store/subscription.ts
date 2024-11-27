import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { StripeSubscription } from '../types/stripe';

interface SubscriptionState {
  subscription: StripeSubscription | null;
  isLoading: boolean;
  error: string | null;
  fetchSubscription: () => Promise<void>;
  setSubscription: (subscription: StripeSubscription | null) => void;
  clearSubscription: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscription: null,
  isLoading: false,
  error: null,

  fetchSubscription: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .single();

      if (error) throw error;
      set({ subscription, isLoading: false });
    } catch (error) {
      console.error('Error fetching subscription:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch subscription', 
        isLoading: false 
      });
    }
  },

  setSubscription: (subscription) => {
    set({ subscription });
  },

  clearSubscription: () => {
    set({ subscription: null });
  },
}));