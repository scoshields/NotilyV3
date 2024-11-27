import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage,
    flowType: 'pkce',
  },
});

// Set up session recovery
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED' && session) {
    // Session was successfully refreshed
    console.log('Session refreshed successfully');
  } else if (event === 'SIGNED_OUT') {
    // Clear any local session data
    localStorage.removeItem('supabase.auth.token');
  }
});