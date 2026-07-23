import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ApiFootballRateLimitError } from '@/lib/services/apiFootball';
import { ensureClub, ensurePlayer } from '@/lib/data/playerSync';
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

interface ImportRow {
  club_api_id: number;
  player_api_id: number;
}

// Bulk-provisions clubs + players from a list of API-Football ids —
// the admin-facing "upload a squad list" counterpart to /api/sync/player
// (which only ever creates one player at a time, on page view). Every
// row created here still only stores the API-Football id + an "af-"
// prefixed row id, so it automatically joins the same auto-update
// pipeline (refreshClubPlayers after each finished match) as anything
// created one-by-one.
//
// Deliberately does NOT trust any bio data in the uploaded file itself
// (name, position, etc.) — those columns, if present, are for the
// admin's own reference only. The actual stored data always comes
// straight from API-Football, so it can't drift or be spoofed by a bad
// upload.
//
// Idempotent + resumable: rows that already exist locally are skipped
// instantly (no API call). If the API-Football rate limit is hit
// mid-import, processing stops immediately and returns a partial
// summary — re-running the same file later picks up exactly where it
// left off.
export async function POST(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => null);
  const rows: ImportRow[] = body?.rows;
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'No rows provided' }, { status: 400 });
  }
  if (rows.length > 500) {
    return NextResponse.json({ error: 'حد أقصى 500 صف بالملف الواحد — قسّمه لملفات أصغر.' }, { status: 400 });
  }

  const admin = createAdminClient();

  const summary = {
    clubsCreated: 0,
    clubsExisting: 0,
    playersCreated: 0,
    playersExisting: 0,
    playersFailed: 0,
    rateLimited: false,
    errors: [] as string[],
  };

  const clubCache = new Map<number, string | null>(); // apiTeamId -> clubId ('af-...') or null if it failed

  outer: for (const row of rows) {
    const apiTeamId = Number(row.club_api_id);
    const apiPlayerId = Number(row.player_api_id);
    if (!Number.isFinite(apiTeamId) || !Number.isFinite(apiPlayerId)) {
      summary.errors.push(`صف غير صالح: ${JSON.stringify(row)}`);
      continue;
    }

    const clubId = `af-${apiTeamId}`;

    if (!clubCache.has(apiTeamId)) {
      try {
        const { club, created } = await ensureClub(admin, clubId, apiTeamId);
        if (!club) {
          clubCache.set(apiTeamId, null);
          summary.errors.push(`النادي af-${apiTeamId}: غير موجود على API-Football`);
          continue;
        }
        clubCache.set(apiTeamId, clubId);
        if (created) summary.clubsCreated++;
        else summary.clubsExisting++;
      } catch (e: unknown) {
        if (e instanceof ApiFootballRateLimitError) {
          summary.rateLimited = true;
          break outer;
        }
        clubCache.set(apiTeamId, null);
        summary.errors.push(`النادي af-${apiTeamId}: ${getErrorMessage(e, 'خطأ غير معروف')}`);
        continue;
      }
    }

    if (clubCache.get(apiTeamId) === null) continue; // Club failed earlier — skip its players.

    const playerId = `af-${apiPlayerId}`;
    try {
      const { player, created } = await ensurePlayer(admin, clubId, playerId, apiPlayerId);
      if (!player) {
        summary.playersFailed++;
        summary.errors.push(`اللاعب af-${apiPlayerId}: غير موجود على API-Football`);
        continue;
      }
      if (created) summary.playersCreated++;
      else summary.playersExisting++;
    } catch (e: unknown) {
      if (e instanceof ApiFootballRateLimitError) {
        summary.rateLimited = true;
        break outer;
      }
      summary.playersFailed++;
      summary.errors.push(`اللاعب af-${apiPlayerId}: ${getErrorMessage(e, 'خطأ غير معروف')}`);
    }
  }

  return NextResponse.json({ summary });
}
