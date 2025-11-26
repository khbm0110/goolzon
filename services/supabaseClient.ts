import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

// FIX: Cast `import.meta` to `any` to resolve TypeScript error about missing 'env' property.
const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

// This function now initializes a singleton client using environment variables.
// It's safer, more reliable, and standard practice for production apps.
export const getSupabase = (): SupabaseClient | null => {
  // If the client is already initialized, return it.
  if (supabase) {
    return supabase;
  }

  // If environment variables are available, create the client.
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      console.log("Initializing Supabase client from environment variables...");
      supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      return supabase;
    } catch (error) {
      console.error("Error creating Supabase client from env vars:", error);
      return null;
    }
  }

  // If env vars are not set, return null.
  // The app's logic will handle this case (e.g., show a message).
  console.warn("Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are not set.");
  return null;
};