// Server-only wrapper around football-data.org (api.football-data.org
// v4) — added as a second fixtures provider alongside API-Football
// because API-Football's FREE plan doesn't include the current season
// at all ("Free plans do not have access to this season, try from
// 2022 to 2024" — confirmed live from this project's own logs), while
// football-data.org's free plan does, for a smaller set of major
// European competitions. See FOOTBALL_DATA_COMPETITION_CODES below for
// exactly which of this project's tracked_leagues that covers.
//
// Reads FOOTBALL_DATA_API_KEY from the environment — not prefixed with
// NEXT_PUBLIC_, so never bundled into client JS. Only import this from
// Route Handlers or other server-only modules, same rule as
// apiFootball.ts.
import type { ApiFootballFixtureSummary, MatchStatus } from './apiFootball';

const BASE_URL = 'https://api.football-data.org/v4';

export function isFootballDataConfigured(): boolean {
  return !!process.env.FOOTBALL_DATA_API_KEY;
}

// API-Football league id (as stored in tracked_leagues.league_api_id)
// -> football-data.org competition code, for every competition their
// free tier actually includes. Anything not in this map simply isn't
// available on football-data.org's free plan (e.g. Arab leagues,
// Botola 2) — those keep going through API-Football as before, which
// means they'll keep failing until that plan is upgraded. This map is
// what decides "does this tracked league get the current-season fix".
export const FOOTBALL_DATA_COMPETITION_CODES: Record<number, string> = {
  39: 'PL', // Premier League
  140: 'PD', // La Liga (Primera Division)
  78: 'BL1', // Bundesliga
  135: 'SA', // Serie A
  61: 'FL1', // Ligue 1
  2: 'CL', // UEFA Champions League
  88: 'DED', // Eredivisie
  94: 'PPL', // Primeira Liga
  40: 'ELC', // Championship (England 2nd tier)
  71: 'BSA', // Brasileirão
  1: 'WC', // World Cup
  4: 'EC', // European Championship
};

async function callFootballData<T>(path: string): Promise<T> {
  const key = process.env.FOOTBALL_DATA_API_KEY;
  if (!key) throw new Error('FOOTBALL_DATA_API_KEY is not set in the server environment.');

  const res = await fetch(`${BASE_URL}${path}`, { headers: { 'X-Auth-Token': key }, cache: 'no-store' });
  if (res.status === 429) {
    throw new Error('football-data.org rate limit exceeded (10 req/min on the free plan). Try again shortly.');
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`football-data.org request failed with status ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

// football-data.org's own status values, mapped onto this project's
// three-value matches.status check constraint. CANCELLED/SUSPENDED
// fixtures are dropped (return null) rather than forced into one of
// the three — there's no honest mapping for "called off".
function mapStatus(raw: string): MatchStatus | null {
  if (raw === 'FINISHED' || raw === 'AWARDED') return 'FINISHED';
  if (raw === 'IN_PLAY' || raw === 'PAUSED') return 'LIVE';
  if (raw === 'SCHEDULED' || raw === 'TIMED' || raw === 'POSTPONED') return 'UPCOMING';
  return null; // CANCELLED, SUSPENDED, or anything unrecognized — skip.
}

interface RawFootballDataMatch {
  id: number;
  utcDate: string;
  status: string;
  matchday: number | null;
  venue?: string | null;
  homeTeam: { id: number; name: string; crest: string | null };
  awayTeam: { id: number; name: string; crest: string | null };
  score: { fullTime: { home: number | null; away: number | null } };
  competition: { id: number; name: string; code: string };
}

function toFixtureSummary(m: RawFootballDataMatch): ApiFootballFixtureSummary | null {
  const status = mapStatus(m.status);
  if (!status) return null;
  return {
    fixtureApiId: m.id,
    date: m.utcDate,
    status,
    statusShort: m.status,
    elapsedMinutes: null, // free tier doesn't expose live elapsed time
    round: m.matchday != null ? `الجولة ${m.matchday}` : null,
    venue: m.venue ?? null,
    homeTeamApiId: m.homeTeam.id,
    homeTeamName: m.homeTeam.name,
    homeTeamLogo: m.homeTeam.crest ?? '',
    awayTeamApiId: m.awayTeam.id,
    awayTeamName: m.awayTeam.name,
    awayTeamLogo: m.awayTeam.crest ?? '',
    scoreHome: m.score.fullTime.home,
    scoreAway: m.score.fullTime.away,
  };
}

// One call covers EVERY mapped competition for the given date — much
// friendlier to the 10-req/min free-tier limit than one call per
// league (which is how the API-Football side of this necessarily
// works, since it has no multi-league filter on /fixtures).
export async function fetchFootballDataFixturesForDate(
  competitionCodes: string[],
  date: string
): Promise<Map<string, ApiFootballFixtureSummary[]>> {
  const byCode = new Map<string, ApiFootballFixtureSummary[]>();
  if (competitionCodes.length === 0) return byCode;

  const json = await callFootballData<{ matches: RawFootballDataMatch[] }>(
    `/matches?competitions=${competitionCodes.join(',')}&dateFrom=${date}&dateTo=${date}`
  );

  for (const raw of json.matches ?? []) {
    const summary = toFixtureSummary(raw);
    if (!summary) continue;
    const code = raw.competition.code;
    if (!byCode.has(code)) byCode.set(code, []);
    byCode.get(code)!.push(summary);
  }
  return byCode;
}

// Used by sync-finished-matches for matches whose data_provider is
// 'football_data' — a single-match status/score lookup, the
// football-data.org equivalent of apiFootball.ts's fetchFixtureStatus.
export async function fetchFootballDataMatchStatus(matchId: number): Promise<{
  isFinished: boolean;
  statusShort: string;
  scoreHome: number | null;
  scoreAway: number | null;
} | null> {
  const json = await callFootballData<RawFootballDataMatch>(`/matches/${matchId}`);
  if (!json) return null;
  return {
    isFinished: json.status === 'FINISHED' || json.status === 'AWARDED',
    statusShort: json.status,
    scoreHome: json.score.fullTime.home,
    scoreAway: json.score.fullTime.away,
  };
}
