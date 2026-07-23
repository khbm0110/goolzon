// Shapes returned by the admin-only autopilot/leagues/bulk-import
// routes (app/api/admin/**). Only used inside app/admin/page.tsx —
// kept separate from lib/data/dbRows.ts because these aren't
// DataProvider-mapped app types, they're raw JSON straight from our
// own Route Handlers.
export interface RssSource {
  name: string;
  url: string;
}

export interface TrackedLeague {
  id: string;
  league_api_id: number;
  season: number;
  name: string;
  country: string | null;
  logo: string | null;
  active: boolean;
  created_at: string;
}

export interface AiAgent {
  id: string;
  name: string;
  persona: string;
  provider_id: string;
  source_type: 'rss' | 'match_analysis' | 'google_trends';
  rss_sources: RssSource[];
  default_category: string;
  // Scopes an RSS agent to specific leagues/clubs — an item is only
  // processed if its title/description mentions one of these. Empty =
  // no filter (process everything from the agent's RSS sources).
  keywords: string[];
  min_words: number;
  byline: string;
  enabled: boolean;
  created_at: string;
}

export interface AiProviderInfo {
  id: string;
  name: string;
  configured: boolean;
}

export interface AutopilotSettings {
  id: number;
  enabled: boolean;
  review_window_minutes: number;
}

export interface PendingArticle {
  id: string;
  agent_id: string | null;
  title: string;
  summary: string | null;
  content: string;
  category: string;
  image_url: string | null;
  source_url: string | null;
  source_name: string | null;
  ai_provider: string | null;
  author: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';
  published_article_id: string | null;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  status: 'new' | 'read';
  created_at: string;
}

export interface BulkImportSummary {
  clubsCreated: number;
  clubsExisting: number;
  playersCreated: number;
  playersExisting: number;
  playersFailed: number;
  rateLimited: boolean;
  errors: string[];
}

export interface BulkImportRow {
  club_api_id: number;
  player_api_id: number;
}
