import { createClient } from '@supabase/supabase-js';

// Safely access environment variables using optional chaining to prevent crashes if `import.meta.env` is undefined.
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing. Check Vercel environment variables. The app will not connect to the database.");
}

// Initialize the client with the variables, or with empty strings as a fallback.
// This prevents the app from crashing on startup if variables are not set.
// Supabase operations will fail gracefully with auth errors, which is the expected behavior in this scenario.
export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");
