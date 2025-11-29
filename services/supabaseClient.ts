import { createClient } from '@supabase/supabase-js';

// FIX: Cast `import.meta` to `any` to access Vite environment variables without causing TypeScript errors.
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing. Please add them to your environment variables.");
}

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);