import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Used for server-side (Server Component) reads that don't need the
// current user's session — articles, matches, clubs, standings, etc.
// are all public-read via RLS ("using (true)"), so no cookie/session
// handling is needed here at all. Deliberately does NOT import
// next/headers, unlike lib/supabase/server.ts, so this file is safe to
// import from code that's also reachable by Client Components.
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
