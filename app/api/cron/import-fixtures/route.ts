import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchFixturesForLeagueOnDate } from '@/lib/services/apiFootball';
import { getErrorMessage } from '@/lib/utils/errors';

// Pulls today's fixtures for every league an admin is tracking
// (`tracked_leagues`) and upserts them into `matches`, filling in
// api_fixture_id / home_team_api_id / away_team_api_id — the piece that
// makes /api/cron/sync-finished-matches actually have something to
// watch, and that makes new-player auto-sync (/api/sync/player) work
// for teams that show up in these matches.
//
// Run once a day (see vercel.json) well before kickoff time. Re-running
// it is safe — matches are upserted by id, so it never creates
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

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: 'Sync is not configured on the server yet.' }, { status: 503 });
  }

  const { data: leagues } = await admin.from('tracked_leagues').select('*').eq('active', true);
  if (!leagues || leagues.length === 0) {
    return NextResponse.json({ leagues: 0, imported: 0, message: 'No tracked leagues yet — add some from لوحة التحكم → الدوريات.' });
  }

  const today = new Date().toISOString().slice(0, 10);
  let imported = 0;
  const errors: string[] = [];

  for (const league of leagues) {
    try {
      const fixtures = await fetchFixturesForLeagueOnDate(league.league_api_id, league.season, today);
      for (const f of fixtures) {
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
        });
        if (error) errors.push(`${f.fixtureApiId}: ${error.message}`);
        else imported++;
      }
    } catch (e: unknown) {
      errors.push(`league ${league.name}: ${getErrorMessage(e, 'unknown error')}`);
    }
  }

  return NextResponse.json({ leagues: leagues.length, imported, errors });
}
