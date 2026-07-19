import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchFixtureLineups, ApiFootballRateLimitError, type ApiFootballTeamLineup } from '@/lib/services/apiFootball';
import { ensureClub, ensurePlayer } from '@/lib/data/playerSync';

// Fetches the real starting XI + substitutes for every UPCOMING/LIVE
// match close to kickoff (lineups publish ~20-40 min before) and
// stores them on match_details.lineups. Every player in the lineup is
// auto-created via ensurePlayer if we don't already have them — this
// is the other natural trigger point (besides someone viewing their
// profile) for "a player who appears in a match should automatically
// get a page", and it happens before kickoff instead of waiting for a
// visitor to click through.
//
// Safe to call repeatedly: matches that already have lineups stored,
// or that API-Football hasn't published lineups for yet, are cheap
// no-ops — this is meant to run on the same frequent schedule as
// /api/cron/sync-finished-matches.
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: 'Sync is not configured on the server yet.' }, { status: 503 });
  }

  // Candidates: matches kicking off within the next 40 minutes, or
  // already live, that came from a real fixture and don't have
  // lineups stored yet.
  const windowEnd = new Date(Date.now() + 40 * 60_000).toISOString();
  const { data: candidates } = await admin
    .from('matches')
    .select('id, home_team_api_id, away_team_api_id, api_fixture_id, status, date')
    .not('api_fixture_id', 'is', null)
    .in('status', ['UPCOMING', 'LIVE'])
    .lte('date', windowEnd);

  if (!candidates || candidates.length === 0) {
    return NextResponse.json({ checked: 0, stored: 0 });
  }

  let stored = 0;
  let notYetPublished = 0;
  const errors: string[] = [];

  for (const match of candidates) {
    const { data: existingDetails } = await admin.from('match_details').select('lineups').eq('match_id', match.id).maybeSingle();
    if (existingDetails?.lineups) continue; // Already have it.

    if (!match.home_team_api_id || !match.away_team_api_id) continue;

    let teams;
    try {
      teams = await fetchFixtureLineups(match.api_fixture_id);
    } catch (e: any) {
      if (e instanceof ApiFootballRateLimitError) break; // Stop burning quota; the rest will get picked up next run.
      errors.push(`${match.id}: ${e?.message ?? 'unknown error'}`);
      continue;
    }
    if (!teams) {
      notYetPublished++;
      continue;
    }

    const homeTeam = teams.find((t) => t.teamApiId === match.home_team_api_id);
    const awayTeam = teams.find((t) => t.teamApiId === match.away_team_api_id);
    if (!homeTeam || !awayTeam) {
      errors.push(`${match.id}: couldn't match lineup teams to home/away by id`);
      continue;
    }

    try {
      const homeClubId = `af-${match.home_team_api_id}`;
      const awayClubId = `af-${match.away_team_api_id}`;
      await ensureClub(admin, homeClubId, match.home_team_api_id);
      await ensureClub(admin, awayClubId, match.away_team_api_id);

      const buildTeamLineup = async (clubId: string, team: ApiFootballTeamLineup) => {
        const mapPlayer = async (p: ApiFootballTeamLineup['startXI'][number]) => {
          const playerId = `af-${p.apiPlayerId}`;
          await ensurePlayer(admin, clubId, playerId, p.apiPlayerId);
          return { id: playerId, apiPlayerId: p.apiPlayerId, name: p.name, number: p.number, position: p.pos };
        };
        return {
          clubId,
          formation: team.formation,
          startXI: await Promise.all(team.startXI.map(mapPlayer)),
          substitutes: await Promise.all(team.substitutes.map(mapPlayer)),
          coachName: team.coachName,
        };
      };

      const lineups = {
        home: await buildTeamLineup(homeClubId, homeTeam),
        away: await buildTeamLineup(awayClubId, awayTeam),
      };

      const { error } = await admin.from('match_details').upsert({ match_id: match.id, lineups }, { onConflict: 'match_id' });
      if (error) throw new Error(error.message);
      stored++;
    } catch (e: any) {
      if (e instanceof ApiFootballRateLimitError) break;
      errors.push(`${match.id}: ${e?.message ?? 'unknown error'}`);
    }
  }

  return NextResponse.json({ checked: candidates.length, stored, notYetPublished, errors });
}
