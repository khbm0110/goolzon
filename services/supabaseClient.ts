import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

export const getSupabase = (url?: string, key?: string): SupabaseClient | null => {
  if (supabase) {
    return supabase;
  }
  if (url && key) {
    try {
      supabase = createClient(url, key);
      return supabase;
    } catch (error) {
      console.error("Error creating Supabase client:", error);
      return null;
    }
  }
  return null;
};
