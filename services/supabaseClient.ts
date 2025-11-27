import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

// This function now initializes a singleton client using environment variables.
// It's safer, more reliable, and standard practice for production apps.
export const getSupabase = (): SupabaseClient | null => {
  // If the client is already initialized, return it.
  if (supabase) {
    return supabase;
  }

  // Environment variables are read inside the function for runtime reliability.
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL as string;
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY as string;

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