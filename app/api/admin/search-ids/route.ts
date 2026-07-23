import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchApiFootballTeams, searchApiFootballPlayersByName, ApiFootballRateLimitError } from '@/lib/services/apiFootball';
import { getErrorMessage } from '@/lib/utils/errors';

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return null;
  return user;
}

// GET /api/admin/search-ids?type=team|player&q=name
// Small helper tool for the admin bulk-import UI: looks up API-Football
// ids by name, so nobody has to dig through api-football.com manually
// to build a CSV/JSON import file.
export async function GET(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const q = searchParams.get('q');
  if (!q || q.trim().length < 3) {
    return NextResponse.json({ error: 'اكتب 3 أحرف على الأقل' }, { status: 400 });
  }

  try {
    if (type === 'team') {
      const results = await searchApiFootballTeams(q);
      return NextResponse.json({ results });
    }
    if (type === 'player') {
      const results = await searchApiFootballPlayersByName(q);
      return NextResponse.json({ results });
    }
    return NextResponse.json({ error: 'type يجب أن يكون team أو player' }, { status: 400 });
  } catch (e: unknown) {
    if (e instanceof ApiFootballRateLimitError) {
      return NextResponse.json({ error: 'تم تجاوز الحد المسموح من طلبات API-Football، حاول بعد دقيقة.' }, { status: 429 });
    }
    return NextResponse.json({ error: getErrorMessage(e, 'API-Football request failed') }, { status: 502 });
  }
}
