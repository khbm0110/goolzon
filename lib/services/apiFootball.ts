// Thin server-only wrapper around API-Football (api-football.com / the
// api-sports.io v3 REST API). Reads API_FOOTBALL_KEY from the
// environment — that variable is NOT prefixed with NEXT_PUBLIC_, so it
// is never bundled into client-side JS. Only ever import this file from
// Route Handlers (app/api/**/route.ts) or other server-only modules —
// never from a 'use client' component or lib/data/supabase-provider.ts
// (which client components also import).
//
// Rate limits (per api-football.com/documentation-v3): the free plan
// allows 10 requests/minute and 100 requests/day. Auto-creating one new
// player can cost up to 3 calls (team + up to 2 season attempts), so
// this quota disappears fast — see ApiFootballRateLimitError handling
// below, which the sync route surfaces as a clear "try again" message
// instead of a false "not found".
import type {
  RawApiFootballTeamStats,
  RawApiFootballPlayer,
  RawApiFootballLeagueEntry,
  RawApiFootballTeamRef,
  RawApiFootballFixtureEntry,
  RawApiFootballLineupPlayerEntry,
  RawApiFootballTeamLineupEntry,
} from './apiFootballRaw';

const BASE_URL = 'https://v3.football.api-sports.io';

export class ApiFootballRateLimitError extends Error {}

function authHeaders(): HeadersInit {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) {
    // Generic on purpose: this runs in production too, where the key
    // lives in the hosting platform's environment variables (e.g.
    // Vercel → Project Settings → Environment Variables), not a
    // .env.local file — that file only exists in local dev and is
    // never deployed.
    throw new Error('API_FOOTBALL_KEY is not set in the server environment.');
  }
  return { 'x-apisports-key': key };
}

interface ApiFootballEnvelope<T> {
  response: T[];
  errors?: Record<string, string> | unknown[];
}

async function callApiFootball<T>(path: string): Promise<ApiFootballEnvelope<T>> {
  const res = await fetch(`${BASE_URL}${path}`, { headers: authHeaders(), cache: 'no-store' });

  if (res.status === 429) {
    throw new ApiFootballRateLimitError('API-Football rate limit exceeded. Try again in a minute.');
  }
  if (!res.ok) {
    throw new Error(`API-Football request failed with status ${res.status}`);
  }

  const json = await res.json();
  // API-Football can return HTTP 200 with an `errors` object populated
  // (e.g. bad season, bad id) — that's a real failure, not a 429, but
  // it's still not "the request succeeded with zero results".
  const errors = json?.errors;
  const hasErrors = errors && (Array.isArray(errors) ? errors.length > 0 : Object.keys(errors).length > 0);
  if (hasErrors) {
    throw new Error(`API-Football returned an error: ${JSON.stringify(errors)}`);
  }
  return json as ApiFootballEnvelope<T>;
}

export interface ApiFootballTeam {
  name: string;
  logo: string;
  country: string | null;
  founded: number | null;
}

export interface ApiFootballSeasonStats {
  matches: number;
  goals: number;
  assists: number;
  rating: number;
  minutes?: number;
  yellowCards?: number;
  redCards?: number;
  shots?: number;
  shotsOnTarget?: number;
  passAccuracy?: number;
  cleanSheets?: number;
  saves?: number;
  tackles?: number;
}

export interface ApiFootballPlayer {
  name: string;
  age: number | null;
  birthDate: string | null;
  birthPlace: string | null;
  heightCm: number | null;
  weightKg: number | null;
  nationality: string | null;
  photo: string | null;
  number: number | null;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  seasonStats: ApiFootballSeasonStats | null;
}

function mapPosition(pos?: string): ApiFootballPlayer['position'] {
  switch (pos) {
    case 'Goalkeeper':
      return 'GK';
    case 'Defender':
      return 'DEF';
    case 'Attacker':
      return 'FWD';
    case 'Midfielder':
    default:
      return 'MID';
  }
}

function mapSeasonStats(stats: RawApiFootballTeamStats | undefined): ApiFootballSeasonStats | null {
  if (!stats) return null;
  const played = stats.games?.appearences ?? stats.games?.appearances ?? 0;
  if (!played) return null; // No minutes on the pitch this season yet — nothing meaningful to show.
  return {
    matches: played,
    goals: stats.goals?.total ?? 0,
    assists: stats.goals?.assists ?? 0,
    rating: stats.games?.rating ? Math.round(parseFloat(stats.games.rating) * 10) / 10 : 0,
    minutes: stats.games?.minutes ?? undefined,
    yellowCards: stats.cards?.yellow ?? undefined,
    redCards: stats.cards?.red ?? undefined,
    shots: stats.shots?.total ?? undefined,
    shotsOnTarget: stats.shots?.on ?? undefined,
    passAccuracy: stats.passes?.accuracy ? Number(stats.passes.accuracy) : undefined,
    cleanSheets: stats.goals?.conceded === 0 ? stats.games?.appearences : undefined,
    saves: stats.goals?.saves ?? undefined,
    tackles: stats.tackles?.total ?? undefined,
  };
}

export async function fetchApiFootballTeam(apiTeamId: number): Promise<ApiFootballTeam | null> {
  const json = await callApiFootball<{ team?: RawApiFootballTeamRef & { country?: string; founded?: number } }>(`/teams?id=${apiTeamId}`);
  const team = json.response[0]?.team;
  if (!team) return null;
  return {
    name: team.name,
    logo: team.logo ?? '',
    country: team.country ?? null,
    founded: team.founded ?? null,
  };
}

// API-Football's /players endpoint is season-scoped — a player who
// transferred mid-year may not have stats for the current season yet,
// so we fall back one year if the current season comes back empty.
export async function fetchApiFootballPlayer(apiPlayerId: number): Promise<ApiFootballPlayer | null> {
  const currentSeason = new Date().getFullYear();
  for (const season of [currentSeason, currentSeason - 1]) {
    const json = await callApiFootball<{ player: RawApiFootballPlayer; statistics?: RawApiFootballTeamStats[] }>(`/players?id=${apiPlayerId}&season=${season}`);
    const entry = json.response[0];
    if (!entry) continue;
    const p = entry.player;
    const stats = entry.statistics?.[0];
    return {
      name: p.name,
      age: p.age ?? null,
      birthDate: p.birth?.date ?? null,
      birthPlace: p.birth?.place ?? null,
      heightCm: p.height ? parseInt(p.height, 10) || null : null,
      weightKg: p.weight ? parseInt(p.weight, 10) || null : null,
      nationality: p.nationality ?? null,
      photo: p.photo ?? null,
      number: stats?.games?.number ?? null,
      position: mapPosition(stats?.games?.position),
      seasonStats: mapSeasonStats(stats),
    };
  }
  return null;
}

export interface ApiFootballFixtureStatus {
  fixtureId: number;
  statusShort: string; // 'NS' | '1H' | 'HT' | '2H' | 'FT' | 'AET' | 'PEN' | ...
  isFinished: boolean;
  homeTeamApiId: number | null;
  awayTeamApiId: number | null;
  scoreHome: number | null;
  scoreAway: number | null;
}

// API-Football marks a match as fully over with one of these codes.
// ('PST'/'CANC'/'ABD' are also "not live anymore" but aren't a finished
// result, so they're deliberately excluded from isFinished.)
const FINISHED_STATUS_CODES = new Set(['FT', 'AET', 'PEN']);

export async function fetchFixtureStatus(fixtureId: number): Promise<ApiFootballFixtureStatus | null> {
  const json = await callApiFootball<RawApiFootballFixtureEntry>(`/fixtures?id=${fixtureId}`);
  const entry = json.response[0];
  if (!entry) return null;
  const statusShort = entry.fixture?.status?.short ?? '';
  return {
    fixtureId,
    statusShort,
    isFinished: FINISHED_STATUS_CODES.has(statusShort),
    homeTeamApiId: entry.teams?.home?.id ?? null,
    awayTeamApiId: entry.teams?.away?.id ?? null,
    scoreHome: entry.goals?.home ?? null,
    scoreAway: entry.goals?.away ?? null,
  };
}

export interface ApiFootballLeagueSearchResult {
  leagueApiId: number;
  name: string;
  country: string | null;
  logo: string | null;
  currentSeason: number | null;
}

// Powers the admin "search leagues" picker — deliberately not hardcoded,
// since league ids (and which season is "current") shift every year.
export async function searchApiFootballLeagues(query: string): Promise<ApiFootballLeagueSearchResult[]> {
  const json = await callApiFootball<RawApiFootballLeagueEntry>(`/leagues?search=${encodeURIComponent(query)}`);
  return json.response.map((entry) => {
    const currentSeasonEntry = (entry.seasons ?? []).find((s) => s.current) ?? null;
    return {
      leagueApiId: entry.league?.id ?? 0,
      name: entry.league?.name ?? '',
      country: entry.country?.name ?? null,
      logo: entry.league?.logo ?? null,
      currentSeason: currentSeasonEntry?.year ?? null,
    };
  });
}

export type MatchStatus = 'UPCOMING' | 'LIVE' | 'FINISHED';

const LIVE_STATUS_CODES = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE']);
const FINISHED_SHORT_CODES = new Set(['FT', 'AET', 'PEN', 'AWD', 'WO']);

function mapMatchStatus(statusShort: string): MatchStatus {
  if (FINISHED_SHORT_CODES.has(statusShort)) return 'FINISHED';
  if (LIVE_STATUS_CODES.has(statusShort)) return 'LIVE';
  return 'UPCOMING';
}

export interface ApiFootballFixtureSummary {
  fixtureApiId: number;
  date: string; // ISO
  status: MatchStatus;
  statusShort: string;
  elapsedMinutes: number | null;
  round: string | null;
  venue: string | null;
  homeTeamApiId: number;
  homeTeamName: string;
  homeTeamLogo: string;
  awayTeamApiId: number;
  awayTeamName: string;
  awayTeamLogo: string;
  scoreHome: number | null;
  scoreAway: number | null;
}

// One call per (league, season, date) — used by the daily fixture
// importer. `date` must be YYYY-MM-DD.
export async function fetchFixturesForLeagueOnDate(leagueApiId: number, season: number, date: string): Promise<ApiFootballFixtureSummary[]> {
  const json = await callApiFootball<RawApiFootballFixtureEntry>(`/fixtures?league=${leagueApiId}&season=${season}&date=${date}`);
  return json.response.map((entry) => ({
    fixtureApiId: entry.fixture?.id ?? 0,
    date: entry.fixture?.date ?? '',
    status: mapMatchStatus(entry.fixture?.status?.short ?? ''),
    statusShort: entry.fixture?.status?.short ?? '',
    elapsedMinutes: entry.fixture?.status?.elapsed ?? null,
    round: entry.league?.round ?? null,
    venue: entry.fixture?.venue?.name ?? null,
    homeTeamApiId: entry.teams?.home?.id ?? 0,
    homeTeamName: entry.teams?.home?.name ?? '',
    homeTeamLogo: entry.teams?.home?.logo ?? '',
    awayTeamApiId: entry.teams?.away?.id ?? 0,
    awayTeamName: entry.teams?.away?.name ?? '',
    awayTeamLogo: entry.teams?.away?.logo ?? '',
    scoreHome: entry.goals?.home ?? null,
    scoreAway: entry.goals?.away ?? null,
  }));
}

export interface ApiFootballTeamSearchResult {
  apiTeamId: number;
  name: string;
  logo: string;
  country: string | null;
}

// GET /teams?search= — used by the admin "find an id" tool.
export async function searchApiFootballTeams(query: string): Promise<ApiFootballTeamSearchResult[]> {
  const json = await callApiFootball<{ team: RawApiFootballTeamRef }>(`/teams?search=${encodeURIComponent(query)}`);
  return json.response.map((entry) => ({
    apiTeamId: entry.team?.id,
    name: entry.team?.name,
    logo: entry.team?.logo ?? '',
    country: entry.team?.country ?? null,
  }));
}

export interface ApiFootballPlayerSearchResult {
  apiPlayerId: number;
  name: string;
  photo: string | null;
  teamName: string | null;
  age: number | null;
}

// GET /players?search= (minimum 3 characters) — same purpose, for
// players. Doesn't require a season/team/league like the main /players
// lookup does; it's specifically meant for name autocomplete.
export async function searchApiFootballPlayersByName(query: string): Promise<ApiFootballPlayerSearchResult[]> {
  if (query.trim().length < 3) return [];
  const json = await callApiFootball<{ player: RawApiFootballPlayer; statistics?: { team?: { name?: string } }[] }>(`/players?search=${encodeURIComponent(query)}`);
  return json.response.map((entry) => ({
    apiPlayerId: entry.player?.id,
    name: entry.player?.name,
    photo: entry.player?.photo ?? null,
    teamName: entry.statistics?.[0]?.team?.name ?? null,
    age: entry.player?.age ?? null,
  }));
}

export interface ApiFootballLineupPlayer {
  apiPlayerId: number;
  name: string;
  number: number | null;
  pos: 'G' | 'D' | 'M' | 'F';
}

export interface ApiFootballTeamLineup {
  teamApiId: number;
  formation: string | null;
  startXI: ApiFootballLineupPlayer[];
  substitutes: ApiFootballLineupPlayer[];
  coachName: string | null;
}

function isValidLineupPos(v: string): v is ApiFootballLineupPlayer['pos'] {
  return v === 'G' || v === 'D' || v === 'M' || v === 'F';
}

function mapLineupPlayer(entry: RawApiFootballLineupPlayerEntry): ApiFootballLineupPlayer {
  const p = entry.player ?? { id: 0, name: '' };
  const rawPos = (p.pos ?? '').toUpperCase();
  const pos: ApiFootballLineupPlayer['pos'] = isValidLineupPos(rawPos) ? rawPos : 'M';
  return { apiPlayerId: p.id, name: p.name, number: p.number ?? null, pos };
}

// Lineups are only published ~20-40 minutes before kickoff (later for
// smaller competitions, sometimes not at all) — an empty `response`
// array is the normal, expected result outside that window, not an
// error. Returns null in that case so callers can just try again on
// the next cron pass.
//
// Returns both teams as a plain array rather than guessing which is
// home/away — API-Football doesn't guarantee response order, so the
// caller should match each entry's `teamApiId` against the match's own
// stored home_team_api_id / away_team_api_id.
export async function fetchFixtureLineups(fixtureId: number): Promise<ApiFootballTeamLineup[] | null> {
  const json = await callApiFootball<RawApiFootballTeamLineupEntry>(`/fixtures/lineups?fixture=${fixtureId}`);
  const teams = json.response;
  if (teams.length < 2) return null;

  return teams.map((entry) => ({
    teamApiId: entry.team?.id ?? 0,
    formation: entry.formation ?? null,
    startXI: (entry.startXI ?? []).map(mapLineupPlayer),
    substitutes: (entry.substitutes ?? []).map(mapLineupPlayer),
    coachName: entry.coach?.name ?? null,
  }));
}
