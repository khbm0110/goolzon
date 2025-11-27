
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

// This function now initializes a singleton client using environment variables.
// It's safer, more reliable, and standard practice for production apps.
export const getSupabase = (): SupabaseClient | null => {
  // If the client is already initialized, return it.
  if (supabase) {
    return supabase;
  }

  // Helper to get environment variables robustly in different environments (Vite/Jest/Node)
  const getEnv = (key: string) => {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
        // @ts-ignore
        return import.meta.env[key];
    }
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
        return process.env[key];
    }
    return '';
  };

  const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
  const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY');

  // If environment variables are available, create the client.
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      console.log("Initializing Supabase client...");
      supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      return supabase;
    } catch (error) {
      console.error("Error creating Supabase client:", error);
      return null;
    }
  }

  // If env vars are not set, return null.
  console.warn("Supabase credentials missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  return null;
};
