import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { CookieOptions } from '@supabase/ssr';

// Cookie-aware server client — reads the real logged-in user's session
// from request cookies, so RLS applies correctly.
//
// ⚠️ ONLY import this file from Route Handlers (app/api/**/route.ts) or
// Server Actions — NEVER from lib/data/supabase-provider.ts or any other
// module that Client Components also import. Because this file imports
// next/headers, doing so breaks the production build for every client
// component that transitively reaches it (even through a dynamic
// import()) — Next.js flags this at build time. See lib/supabase/public.ts
// and lib/supabase/admin.ts for the next/headers-free alternatives used
// by the shared data provider.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Can be called from a Server Component where cookies can't
            // be set — safe to ignore since middleware refreshes sessions.
          }
        },
      },
    }
  );
}
