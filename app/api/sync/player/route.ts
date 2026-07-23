import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ApiFootballRateLimitError } from '@/lib/services/apiFootball';
import { ensureClub, ensurePlayer } from '@/lib/data/playerSync';
import { getErrorMessage } from '@/lib/utils/errors';

// Auto-provisions a club + player the very first time a visitor opens a
// profile page for someone who appeared in a live match (API-Football)
// but doesn't exist in our own `clubs`/`players` tables yet. After this
// runs once, the row is permanent — every future visit is a normal read
// through the regular data provider, and the player's page just works
// like any other page on the site (same dynamic route, nothing special).
//
// Uses the service-role client because writing to `clubs`/`players` is
// normally admin-only via RLS — this endpoint (and the bulk importer)
// are the deliberate, narrow exceptions, and they only ever write data
// sourced from API-Football itself, never arbitrary client input.
//
// IDs from API-Football are namespaced with an "af-" prefix (e.g.
// "af-276") so they can never collide with manually-created admin IDs,
// and so this route can tell at a glance whether a given club/player id
// is safe to auto-create from the API.
export async function POST(request: Request) {
  let body: { clubId?: string; playerId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { clubId, playerId } = body;
  if (typeof clubId !== 'string' || typeof playerId !== 'string') {
    return NextResponse.json({ error: 'Missing clubId or playerId' }, { status: 400 });
  }
  if (!playerId.startsWith('af-')) {
    return NextResponse.json({ error: 'Not an API-Football-sourced player id' }, { status: 400 });
  }
  const apiPlayerId = Number(playerId.replace('af-', ''));
  if (!Number.isFinite(apiPlayerId)) {
    return NextResponse.json({ error: 'Invalid player id' }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: 'Sync is not configured on the server yet.' }, { status: 503 });
  }

  try {
    let club;
    if (clubId.startsWith('af-')) {
      const apiTeamId = Number(clubId.replace('af-', ''));
      if (!Number.isFinite(apiTeamId)) return NextResponse.json({ error: 'Invalid club id' }, { status: 400 });
      const result = await ensureClub(admin, clubId, apiTeamId);
      if (!result.club) return NextResponse.json({ error: 'Team not found on API-Football' }, { status: 404 });
      club = result.club;
    } else {
      const { data: existingClub } = await admin.from('clubs').select('*').eq('id', clubId).maybeSingle();
      if (!existingClub) return NextResponse.json({ error: 'Club not found locally and cannot be auto-created (not an API-Football id).' }, { status: 404 });
      club = existingClub;
    }

    const { player } = await ensurePlayer(admin, clubId, playerId, apiPlayerId);
    if (!player) return NextResponse.json({ error: 'Player not found on API-Football' }, { status: 404 });

    return NextResponse.json({ club, player });
  } catch (e: unknown) {
    if (e instanceof ApiFootballRateLimitError) {
      return NextResponse.json({ error: 'تم تجاوز الحد المسموح من طلبات API-Football، حاول بعد دقيقة.' }, { status: 429 });
    }
    return NextResponse.json({ error: getErrorMessage(e, 'API-Football request failed') }, { status: 502 });
  }
}
