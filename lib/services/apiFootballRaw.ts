// Raw response shapes exactly as API-Football's v3 REST API returns
// them (snake_case-free — API-Football itself uses camelCase-ish JSON
// already, just deeply nested and full of optional fields depending on
// plan/competition). Only the fields this app actually reads are
// declared; everything else on the real response is ignored. Used
// exclusively inside lib/services/apiFootball.ts to replace `any` when
// mapping `callApiFootball()`'s JSON into this app's own types.
export interface RawApiFootballTeamStats {
  games?: {
    appearences?: number;
    appearances?: number;
    minutes?: number;
    number?: number;
    position?: string;
    rating?: string;
  };
  goals?: {
    total?: number;
    assists?: number;
    conceded?: number;
    saves?: number;
  };
  cards?: {
    yellow?: number;
    red?: number;
  };
  shots?: {
    total?: number;
    on?: number;
  };
  passes?: {
    accuracy?: number | string;
  };
  tackles?: {
    total?: number;
  };
}

export interface RawApiFootballPlayer {
  id: number;
  name: string;
  age?: number;
  birth?: { date?: string; place?: string };
  height?: string;
  weight?: string;
  nationality?: string;
  photo?: string;
}

export interface RawApiFootballLeagueSeason {
  year: number;
  current: boolean;
}

export interface RawApiFootballLeagueEntry {
  league?: { id: number; name: string; logo?: string };
  country?: { name?: string };
  seasons?: RawApiFootballLeagueSeason[];
}

export interface RawApiFootballTeamRef {
  id: number;
  name: string;
  logo?: string;
  country?: string;
}

export interface RawApiFootballFixtureEntry {
  fixture?: {
    id: number;
    date: string;
    status?: { short?: string; elapsed?: number };
    venue?: { name?: string };
  };
  league?: { round?: string };
  teams?: {
    home?: RawApiFootballTeamRef;
    away?: RawApiFootballTeamRef;
  };
  goals?: { home?: number | null; away?: number | null };
}

export interface RawApiFootballLineupPlayerEntry {
  player?: {
    id: number;
    name: string;
    number?: number | null;
    pos?: string;
  };
}

export interface RawApiFootballTeamLineupEntry {
  team?: { id: number };
  formation?: string;
  startXI?: RawApiFootballLineupPlayerEntry[];
  substitutes?: RawApiFootballLineupPlayerEntry[];
  coach?: { name?: string };
}
