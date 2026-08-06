import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchFixturesForLeagueOnDate } from '@/lib/services/apiFootball';
import { fetchFootballDataFixturesForDate, isFootballDataConfigured, FOOTBALL_DATA_COMPETITION_CODES } from '@/lib/services/footballData';
import { getErrorMessage } from '@/lib/utils/errors';

interface TrackedLeague {
  id: string;
  name: string;
  country: string | null;
  league_api_id: number;
  season: number;
  active: boolean;
}

// Pulls today's fixtures for every league an admin is tracking
// (`tracked_leagues`) and upserts them into `matches`, filling in
// api_fixture_id / home_team_api_id / away_team_api_id — the piece that
// makes /api/cron/sync-finished-matches actually have something to
// watch, and that makes new-player auto-sync (/api/sync/player) work
// for teams that show up in these matches.
//
// Run once a day (see supabase/cron-setup.sql) well before kickoff time.
// Re-running it is safe — matches are upserted by id, so it never creates
// duplicates, it just refreshes kickoff time/venue/round if they
// changed since the last run.
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: 'Sync is not configured on the server yet.' }, { status: 503 });
  }

  const { data: leagues } = await admin.from('tracked_leagues').select('*').eq('active', true).returns<TrackedLeague[]>();
  if (!leagues || leagues.length === 0) {
    return NextResponse.json({ leagues: 0, imported: 0, message: 'No tracked leagues yet — add some from لوحة التحكم → الدوريات.' });
  }

  const today = new Date().toISOString().slice(0, 10);
  let imported = 0;
  const errors: string[] = [];

  async function upsertFixture(f: Awaited<ReturnType<typeof fetchFixturesForLeagueOnDate>>[number], league: TrackedLeague, provider: 'api_football' | 'football_data') {
    const { error } = await admin.from('matches').upsert({
      id: `af-${f.fixtureApiId}`,
      home_team: f.homeTeamName,
      home_logo: f.homeTeamLogo,
      away_team: f.awayTeamName,
      away_logo: f.awayTeamLogo,
      score_home: f.scoreHome,
      score_away: f.scoreAway,
      time: f.status === 'LIVE' && f.elapsedMinutes != null ? `${f.elapsedMinutes}'` : new Date(f.date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      status: f.status,
      league: league.name,
      country: league.country,
      date: f.date,
      round: f.round,
      venue: f.venue,
      api_fixture_id: f.fixtureApiId,
      home_team_api_id: f.homeTeamApiId,
      away_team_api_id: f.awayTeamApiId,
      data_provider: provider,
    });
    if (error) errors.push(`${f.fixtureApiId}: ${error.message}`);
    else imported++;
  }

  // Split tracked leagues by which upstream can actually serve them.
  // football-data.org's free plan covers the current season for a
  // fixed set of major European competitions (see
  // FOOTBALL_DATA_COMPETITION_CODES) — use it for those, since
  // API-Football's free plan can't return current-season data at all
  // ("Free plans do not have access to this season"). Everything else
  // (Arab leagues, Botola 2, etc.) still goes through API-Football as
  // before, and will keep failing on the free plan until that's
  // upgraded — this only fixes the leagues football-data.org actually
  // has.
  const fdLeagues = leagues.filter((l) => isFootballDataConfigured() && FOOTBALL_DATA_COMPETITION_CODES[l.league_api_id]);
  const afLeagues = leagues.filter((l) => !fdLeagues.includes(l));

  if (fdLeagues.length > 0) {
    try {
      const codes = fdLeagues.map((l) => FOOTBALL_DATA_COMPETITION_CODES[l.league_api_id]);
      const fixturesByCode = await fetchFootballDataFixturesForDate(codes, today);
      for (const league of fdLeagues) {
        const code = FOOTBALL_DATA_COMPETITION_CODES[league.league_api_id];
        for (const f of fixturesByCode.get(code) ?? []) {
          await upsertFixture(f, league, 'football_data');
        }
      }
    } catch (e: unknown) {
      errors.push(`football-data.org: ${getErrorMessage(e, 'unknown error')}`);
    }
  }

  for (const league of afLeagues) {
    try {
      const fixtures = await fetchFixturesForLeagueOnDate(league.league_api_id, league.season, today);
      for (const f of fixtures) {
        await upsertFixture(f, league, 'api_football');
      }
    } catch (e: unknown) {
      errors.push(`league ${league.name}: ${getErrorMessage(e, 'unknown error')}`);
    }
  }

  return NextResponse.json({ leagues: leagues.length, viaFootballData: fdLeagues.length, viaApiFootball: afLeagues.length, imported, errors });
}
