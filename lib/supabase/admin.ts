import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// SERVICE ROLE KEY — bypasses RLS entirely. Only ever call the function
// this exports from code that runs on the server (a Route Handler, or a
// function branch already guarded by `typeof window === 'undefined'`).
// This file intentionally has zero dependency on next/headers/cookies,
// so importing it doesn't poison any client component's bundle — unlike
// lib/supabase/server.ts, which imports next/headers and must never be
// reachable from client-side code, even via a conditional/dynamic import.
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set.');
  }
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
