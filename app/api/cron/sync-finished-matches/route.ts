import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchFixtureStatus } from '@/lib/services/apiFootball';
import { refreshClubPlayers } from '@/lib/data/playerSync';
import { generateMatchAnalysis } from '@/lib/data/matchAnalysis';

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
// Cron (see vercel.json) or any uptime/cron service hitting this URL.
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
    .select('id, home_team, away_team, league, date, api_fixture_id, home_team_api_id, away_team_api_id')
    .eq('status', 'LIVE')
    .not('api_fixture_id', 'is', null);

  if (!liveMatches || liveMatches.length === 0) {
    return NextResponse.json({ checked: 0, finished: 0 });
  }

  let finished = 0;
  const results: Record<string, string> = {};

  for (const match of liveMatches) {
    try {
      const fixture = await fetchFixtureStatus(match.api_fixture_id);
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

      // 2) Refresh both clubs' players immediately — this is the
      // "instant" part: no waiting for anyone to visit a page.
      const homeClubId = match.home_team_api_id ? `af-${match.home_team_api_id}` : null;
      const awayClubId = match.away_team_api_id ? `af-${match.away_team_api_id}` : null;
      if (homeClubId) await refreshClubPlayers(admin, homeClubId);
      if (awayClubId) await refreshClubPlayers(admin, awayClubId);

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
    } catch (e: any) {
      results[match.id] = `error: ${e?.message ?? 'unknown'}`;
    }
  }

  return NextResponse.json({ checked: liveMatches.length, finished, results });
}
