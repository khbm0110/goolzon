import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchApiFootballPlayer, fetchApiFootballTeam } from '@/lib/services/apiFootball';

// Server-only. Gets-or-creates a club row from an API-Football team id.
// Shared by the on-view sync route and the bulk importer so both stay
// in sync with exactly the same mapping/insert logic.
export async function ensureClub(admin: SupabaseClient, clubId: string, apiTeamId: number) {
  const { data: existing } = await admin.from('clubs').select('*').eq('id', clubId).maybeSingle();
  if (existing) return { club: existing, created: false };

  const team = await fetchApiFootballTeam(apiTeamId); // may throw ApiFootballRateLimitError
  if (!team) return { club: null, created: false };

  const { data: inserted, error } = await admin
    .from('clubs')
    .insert({
      id: clubId,
      name: team.name,
      english_name: team.name,
      logo: team.logo,
      country: team.country,
      founded: team.founded,
      colors: { primary: '#10b981', secondary: '#0f172a', text: '#ffffff' },
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return { club: inserted, created: true };
}

// Server-only. Gets-or-creates a player row from an API-Football player
// id, scoped to a club that must already exist.
export async function ensurePlayer(admin: SupabaseClient, clubId: string, playerId: string, apiPlayerId: number) {
  const { data: existing } = await admin.from('players').select('*').eq('club_id', clubId).eq('id', playerId).maybeSingle();
  if (existing) return { player: existing, created: false };

  const apiPlayer = await fetchApiFootballPlayer(apiPlayerId); // may throw ApiFootballRateLimitError
  if (!apiPlayer) return { player: null, created: false };

  const { data: inserted, error } = await admin
    .from('players')
    .insert({
      id: playerId,
      club_id: clubId,
      name: apiPlayer.name,
      age: apiPlayer.age,
      birth_date: apiPlayer.birthDate,
      birth_place: apiPlayer.birthPlace,
      height_cm: apiPlayer.heightCm,
      weight_kg: apiPlayer.weightKg,
      number: apiPlayer.number,
      position: apiPlayer.position,
      nationality: apiPlayer.nationality,
      image: apiPlayer.photo,
      rating: 65,
      season_stats: apiPlayer.seasonStats,
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return { player: inserted, created: true };
}

// Server-only. Re-fetches every player we already track for a given
// club from API-Football and UPDATEs (not inserts) their bio + season
// stats. This is what "instant update right after the match" actually
// calls under the hood — it deliberately never creates new players
// (that stays the job of /api/sync/player, triggered by a page view),
// it only refreshes players we already have on file for that club.
export async function refreshClubPlayers(admin: SupabaseClient, clubId: string) {
  const { data: players } = await admin.from('players').select('id').eq('club_id', clubId);
  if (!players || players.length === 0) return { updated: 0, failed: 0 };

  let updated = 0;
  let failed = 0;

  for (const row of players) {
    const playerId: string = row.id;
    if (!playerId.startsWith('af-')) continue; // Admin-entered players aren't API-sourced — leave them alone.
    const apiPlayerId = Number(playerId.replace('af-', ''));
    if (!Number.isFinite(apiPlayerId)) continue;

    try {
      const apiPlayer = await fetchApiFootballPlayer(apiPlayerId);
      if (!apiPlayer) {
        failed++;
        continue;
      }
      const { error } = await admin
        .from('players')
        .update({
          name: apiPlayer.name,
          age: apiPlayer.age,
          height_cm: apiPlayer.heightCm,
          weight_kg: apiPlayer.weightKg,
          number: apiPlayer.number,
          position: apiPlayer.position,
          nationality: apiPlayer.nationality,
          image: apiPlayer.photo,
          season_stats: apiPlayer.seasonStats,
        })
        .eq('id', playerId)
        .eq('club_id', clubId);
      if (error) failed++;
      else updated++;
    } catch {
      // Rate-limited or a transient API failure on this one player —
      // move on to the rest rather than aborting the whole squad.
      failed++;
    }
  }

  return { updated, failed };
}
