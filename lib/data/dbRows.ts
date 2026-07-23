// Raw row shapes exactly as Postgres/Supabase returns them (snake_case
// columns, as defined in supabase/schema.sql) — used only inside the
// mapXxx() functions in supabase-provider.ts that translate a DB row
// into the camelCase app types from @/types. Keeping these separate
// from the app types on purpose: the DB shape and the app shape are
// allowed to drift (e.g. a column rename shouldn't force an app-wide
// type change), and this is the one place that reconciles them.
import type { PlayerStats, PlayerSeasonStats, AdPlacement, Category } from '@/types';

export interface ArticleRow {
  id: string;
  title: string;
  summary: string | null;
  content: string;
  category: Category;
  image_url: string | null;
  is_breaking: boolean;
  views: number;
  author: string | null;
  video_embed_id: string | null;
  date: string;
}

export interface MatchRow {
  id: string;
  home_team: string;
  home_logo: string | null;
  away_team: string;
  away_logo: string | null;
  score_home: number | null;
  score_away: number | null;
  time: string | null;
  status: 'UPCOMING' | 'LIVE' | 'FINISHED';
  league: string | null;
  country: Category;
  date: string | null;
  round: string | null;
  venue: string | null;
  api_fixture_id: number | null;
  home_team_api_id: number | null;
  away_team_api_id: number | null;
}

export interface StandingRow {
  rank: number;
  team: string;
  logo: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  league: string;
}

export interface PlayerRow {
  id: string;
  club_id: string;
  name: string;
  english_name: string | null;
  age: number | null;
  birth_date: string | null;
  birth_place: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  preferred_foot: 'LEFT' | 'RIGHT' | 'BOTH' | null;
  number: number | null;
  position: 'GK' | 'DEF' | 'MID' | 'FWD' | 'ST' | 'CB' | 'CM' | 'CDM' | 'CAM' | 'RW' | 'LW' | 'LB' | 'RB' | 'RM' | 'LM';
  rating: number | null;
  nationality: string | null;
  image: string | null;
  market_value: number | null;
  stats: PlayerStats | null;
  season_stats: PlayerSeasonStats | null;
}

export interface ClubRow {
  id: string;
  name: string;
  english_name: string | null;
  logo: string | null;
  cover_image: string | null;
  founded: number | null;
  stadium: string | null;
  coach: string | null;
  nickname: string | null;
  colors: { primary: string; secondary: string; text: string } | null;
  social: { twitter?: string; instagram?: string } | null;
  fan_count: number | null;
  country: Category;
  history_text: string | null;
}

export interface TrophyRow {
  id: string;
  club_id: string;
  name: string;
  count: number;
}

export interface CommentRow {
  id: string;
  article_id: string;
  user_id: string;
  parent_id: string | null;
  text: string;
  likes: number;
  status: 'visible' | 'reported' | 'hidden';
  created_at: string;
  // Joined from `profiles` via a foreign-table select (comments.select('*, profiles(name, avatar)')).
  profiles?: { name: string; avatar: string | null } | null;
}

export interface ProfileRow {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string | null;
  role: 'user' | 'admin';
  status: 'active' | 'banned';
  join_date: string;
}

export interface AdSlotRow {
  id: string;
  placement: AdPlacement;
  label: string;
  network: 'adsense' | 'direct' | 'other';
  code: string;
  enabled: boolean;
  pages: string[];
  start_date: string | null;
  end_date: string | null;
  updated_at: string;
}
