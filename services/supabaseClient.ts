import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 🔹 قيم Supabase مباشرة لتجنب مشاكل AI Studio مع .env
const SUPABASE_URL = "https://prbfqykvhdwycaqachnf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByYmZxeWt2aGR3eWNhcWFjaG5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNzgxNjAsImV4cCI6MjA3OTY1NDE2MH0.mgtOwoYLJAGItpu6N-ScjXCEi_L8-RPZjRVwVXq2cq0";

let supabaseClient: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (supabaseClient) return supabaseClient;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("❌ Supabase credentials missing!");
  }

  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log("🔥 Supabase initialized!");
  return supabaseClient;
};
