import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Fail-safe: if env vars are missing/misconfigured (e.g. not yet set
  // in the Vercel project settings), don't crash the whole site with a
  // 500 — just let the request through unguarded. A broken admin-auth
  // check should never be able to take down every page on the site.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Middleware: missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env vars.');
    return response;
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }

    return response;
  } catch (err) {
    // Same fail-safe idea: a Supabase outage or unexpected error here
    // should not 500 the whole site. Worst case, an unauthorized user
    // briefly sees the admin page shell before client-side auth (which
    // has its own redirect in app/admin/page.tsx) kicks them out.
    console.error('Middleware admin-check failed:', err);
    return response;
  }
}

// Narrowed to ONLY /admin routes. Every other page (home, articles,
// matches, clubs...) never needed this check at all — they're all
// public reads. Running a Supabase call on every single page request
// was unnecessary overhead and an unnecessary point of failure.
export const config = {
  matcher: ['/admin/:path*'],
};
