import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Initialize database client with error handling
const supabaseUrl = 'https://ucqpclwadgmqgarxepvt.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjliMWY5OTk4LTE4NmMtNDJlYS05MWQyLTkyOWVhZjliMGFhNCJ9.eyJwcm9qZWN0SWQiOiJ1Y3FwY2x3YWRnbXFnYXJ4ZXB2dCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzY2MzY3MzQzLCJleHAiOjIwODE3MjczNDMsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.tsfLjRNbKRC_HSAAGnp2QW2sGqmv6H1MuWxBncvr7tw';

let supabase: SupabaseClient;

try {
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'x-client-info': 'the-club-web'
      }
    },
    realtime: {
      params: {
        eventsPerSecond: 2
      }
    }
  });

} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
  // Create a minimal mock client to prevent crashes
  supabase = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Supabase not available') }),
      signUp: () => Promise.resolve({ data: null, error: new Error('Supabase not available') }),
      signOut: () => Promise.resolve({ error: null }),
      signInWithOAuth: () => Promise.resolve({ data: null, error: new Error('Supabase not available') }),
      resetPasswordForEmail: () => Promise.resolve({ data: null, error: new Error('Supabase not available') }),
      updateUser: () => Promise.resolve({ data: null, error: new Error('Supabase not available') }),
      resend: () => Promise.resolve({ data: null, error: new Error('Supabase not available') }),
      verifyOtp: () => Promise.resolve({ data: null, error: new Error('Supabase not available') }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    from: () => ({
      select: () => Promise.resolve({ data: null, error: new Error('Supabase not available') }),
      insert: () => Promise.resolve({ data: null, error: new Error('Supabase not available') }),
      update: () => Promise.resolve({ data: null, error: new Error('Supabase not available') }),
      delete: () => Promise.resolve({ data: null, error: new Error('Supabase not available') })
    }),
    functions: {
      invoke: () => Promise.resolve({ data: null, error: new Error('Supabase not available') })
    }
  } as unknown as SupabaseClient;
}

export { supabase };
