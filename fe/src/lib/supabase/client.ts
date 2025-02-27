// fe/src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

// Environment variables with fallbacks
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://tlisuscglzjklteovbez.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsaXN1c2NnbHpqa2x0ZW92YmV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2MjgxNDQsImV4cCI6MjA1NjIwNDE0NH0.fF8pHPmWXXw-c_geTYrld-EZ0Gg422q_eIj0uEDlYC4';

// Create a single client for both auth and data operations
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

// Export the same client (no separate admin client in browser)
export const supabaseAdmin = supabase;