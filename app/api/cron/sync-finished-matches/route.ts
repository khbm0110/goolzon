import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchFixtureStatus } from '@/lib/services/apiFootball';
import { fetchFootballDataMatchStatus } from '@/lib/services/footballData';
import { refreshClubPlayers } from '@/lib/data/playerSync';
import { generateMatchAnalysis } from '@/lib/data/matchAnalysis';
import { sendPushToFollowers } from '@/lib/services/webPush';
import { getErrorMessage } from '@/lib/utils/errors';

// This is the route that delivers "فوري بعد كل مباراة": it checks every
// match we're currently tracking as LIVE and linked to a real
// API-Football fixture (matches.api_fixture_id). The instant one of
// them reports a finished status, this:
//   1) writes the final score + FINISHED status back into `matches`
//   2) immediately refreshes every player of both clubs from
//      API-Football, so player pages reflect the match right away
//      instead of waiting on a timer.
//
// Next.js has no built-in scheduler, so something external has to call
// this endpoint every 1–2 minutes while matches are live — e.g. Vercel
// Cron (see supabase/cron-setup.sql, runs every 2 minutes via pg_cron) or any uptime/cron service hitting this URL.
// It's intentionally idempotent and cheap to call repeatedly: a match
// that's already FINISHED is simply skipped on every next run.
//
// Protect this in production with CRON_SECRET so randoms can't trigger
// it and burn your API-Football quota.
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

  const { data: liveMatches } = await admin
    .from('matches')
    .select('id, home_team, away_team, league, date, api_fixture_id, home_team_api_id, away_team_api_id, data_provider')
    .eq('status', 'LIVE')
    .not('api_fixture_id', 'is', null);

  if (!liveMatches || liveMatches.length === 0) {
    return NextResponse.json({ checked: 0, finished: 0 });
  }

  let finished = 0;
  const results: Record<string, string> = {};

  for (const match of liveMatches) {
    try {
      // football-data.org and API-Football use entirely different
      // fixture/team id schemes, so which status-check function (and
      // whether the ids even mean anything to it) depends entirely on
      // which one this particular match came from.
      const isFootballData = match.data_provider === 'football_data';
      const fixture = isFootballData
        ? await fetchFootballDataMatchStatus(match.api_fixture_id).then((r) =>
            r ? { isFinished: r.isFinished, statusShort: r.statusShort, scoreHome: r.scoreHome, scoreAway: r.scoreAway } : null
          )
        : await fetchFixtureStatus(match.api_fixture_id);
      if (!fixture) {
        results[match.id] = 'fixture-not-found';
        continue;
      }
      if (!fixture.isFinished) {
        results[match.id] = `still-${fixture.statusShort}`;
        continue;
      }

      // 1) Lock in the final result.
      await admin
        .from('matches')
        .update({ status: 'FINISHED', score_home: fixture.scoreHome, score_away: fixture.scoreAway, time: 'إنتهت' })
        .eq('id', match.id);

      // 1b) Tell anyone following either club or this league — this is
      // the other half of "follow a team" actually meaning something.
      // Best-effort: a notification failure should never stop the rest
      // of this match's processing (player refresh, analysis article).
      try {
        await sendPushToFollowers(admin, [match.home_team, match.away_team, match.league], {
          title: `⚽ انتهت: ${match.home_team} ${fixture.scoreHome ?? 0} - ${fixture.scoreAway ?? 0} ${match.away_team}`,
          body: match.league || '',
          url: `/match/${match.id}`,
        });
      } catch {
        // no-op — see comment above.
      }

      // 2) Refresh both clubs' players immediately — this is the
      // "instant" part: no waiting for anyone to visit a page. Only
      // possible for API-Football matches: home_team_api_id/
      // away_team_api_id are football-data.org's own team ids for a
      // football_data match, which don't correspond to anything in
      // API-Football's catalogue, and football-data.org's free plan
      // has no player/squad data to sync from at all.
      if (!isFootballData) {
        const homeClubId = match.home_team_api_id ? `af-${match.home_team_api_id}` : null;
        const awayClubId = match.away_team_api_id ? `af-${match.away_team_api_id}` : null;
        if (homeClubId) await refreshClubPlayers(admin, homeClubId);
        if (awayClubId) await refreshClubPlayers(admin, awayClubId);
      }

      // 3) Let "وكيل التحليل" write a tactical analysis from the final
      // score (+ stats if match_details has any) — no-ops quietly if
      // that agent is disabled.
      await generateMatchAnalysis(admin, {
        id: match.id,
        home_team: match.home_team,
        away_team: match.away_team,
        score_home: fixture.scoreHome,
        score_away: fixture.scoreAway,
        league: match.league,
        date: match.date,
      });

      finished++;
      results[match.id] = 'finished-and-synced';
    } catch (e: unknown) {
      results[match.id] = `error: ${getErrorMessage(e, 'unknown')}`;
    }
  }

  return NextResponse.json({ checked: liveMatches.length, finished, results });
}
