import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Where Google/Facebook redirect back to after the person approves the
// login on the provider's own page. Exchanges the one-time `code` for
// a real Supabase session (sets the auth cookies), then sends them on
// to wherever they were headed — or the homepage by default.
// handle_new_user() (see supabase/schema.sql) auto-creates their
// profiles row the same way it does for email/password signups.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}
