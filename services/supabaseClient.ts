import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;
let currentUrl: string | undefined;
let currentKey: string | undefined;

// This function now ensures that if credentials change, a new client is created.
// This prevents stale clients from being used after settings are updated or after a page refresh.
export const getSupabase = (url?: string, key?: string): SupabaseClient | null => {
  // Condition to create a new client:
  // 1. We have a URL and a Key.
  // 2. Either there's no existing client, OR the provided URL/Key are different from the current ones.
  if (url && key && (!supabase || url !== currentUrl || key !== currentKey)) {
    try {
      console.log("Creating/Re-creating Supabase client...");
      supabase = createClient(url, key);
      currentUrl = url;
      currentKey = key;
    } catch (error) {
      console.error("Error creating Supabase client:", error);
      // Reset on failure
      supabase = null;
      currentUrl = undefined;
      currentKey = undefined;
    }
  } else if (!url || !key) {
    // If no credentials are provided, ensure we don't use a stale client.
    if (supabase) {
        console.log("Disconnecting Supabase client due to missing credentials.");
    }
    supabase = null;
    currentUrl = undefined;
    currentKey = undefined;
  }
  
  return supabase;
};