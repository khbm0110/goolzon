import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { searchApiFootballLeagues } from '@/lib/services/apiFootball';

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

// GET /api/admin/leagues            -> list currently tracked leagues
// GET /api/admin/leagues?q=saudi    -> search API-Football for leagues to add
export async function GET(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (q) {
    try {
      const results = await searchApiFootballLeagues(q);
      return NextResponse.json({ results });
    } catch (e: any) {
      return NextResponse.json({ error: e?.message ?? 'API-Football request failed' }, { status: 502 });
    }
  }

  const admin = createAdminClient();
  const { data } = await admin.from('tracked_leagues').select('*').order('created_at', { ascending: false });
  return NextResponse.json({ leagues: data ?? [] });
}

// POST { leagueApiId, season, name, country, logo } -> start tracking a league
export async function POST(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { leagueApiId, season, name, country, logo } = body;
  if (!leagueApiId || !season || !name) {
    return NextResponse.json({ error: 'Missing leagueApiId, season, or name' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('tracked_leagues')
    .upsert({ id: `af-${leagueApiId}-${season}`, league_api_id: leagueApiId, season, name, country, logo, active: true })
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ league: data });
}

// DELETE { id } -> stop tracking a league
export async function DELETE(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from('tracked_leagues').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
