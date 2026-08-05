import { createBrowserClient } from '@supabase/ssr';

// Used inside 'use client' components. Only ever uses the public anon
// key — never the service role key — so it's safe to ship to the
// browser. All real access control happens through Postgres Row Level
// Security policies (see supabase/schema.sql).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
