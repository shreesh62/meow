import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const isConfigured = supabaseUrl && supabaseAnonKey;

if (!isConfigured) {
  console.error('Meow Error: Missing Supabase Environment Variables. Application will not work.');
}

// Export a safe client that won't crash the app on load, 
// but will fail gracefully if methods are called.
export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      // Mock basic methods to prevent "cannot read property of undefined" immediate crashes
      from: () => ({
        select: () => Promise.resolve({ error: { message: 'Supabase not configured' } }),
        insert: () => Promise.resolve({ error: { message: 'Supabase not configured' } }),
        upsert: () => Promise.resolve({ error: { message: 'Supabase not configured' } }),
        eq: () => ({ single: () => Promise.resolve({ error: { message: 'Supabase not configured' } }) }),
      }),
      channel: () => ({
        on: () => ({ subscribe: () => {} })
      }),
      removeChannel: () => {},
      auth: {
        getSession: () => Promise.resolve({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
      }
    };

export const isSupabaseConfigured = !!isConfigured;
