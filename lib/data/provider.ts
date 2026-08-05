import type { Article, Match, Standing, ClubProfile, Comment, User, Sponsor, SeoSettings, FeatureFlags, Player, DreamSquadPlayer, MatchDetails, AdSlot, AdsGlobalSettings, League } from '@/types';
import type { Prediction, LeaderboardEntry, Poll, TransferRecord, InjuryRecord, AwardRecord, CoachCareerEntry } from '@/types/community';

// This is the single "contract" the whole app talks to for data.
// `supabase-provider.ts` (lib/data/index.ts) is the one real
// implementation, backed by Postgres/Supabase — see
// supabase/schema.sql for the underlying tables. No page or component
// ever imports Supabase directly; they only ever import `data` from
// lib/data/index.ts.
export interface DataProvider {
  // `options` lets a caller ask only for what it needs instead of every
  // row in the table — every article ever written by an autopilot
  // agent lives here forever, so an unbounded fetch only gets more
  // expensive over time. `limit` caps row count; `category`/`categories`
  // push the filter into the query itself (e.g. a league/country page,
  // or a user's several followed leagues at once) instead of fetching
  // everything and filtering in memory. Omit all three for the few
  // places that genuinely need the full table (admin's article list,
  // the sitemap).
  getArticles(options?: { limit?: number; category?: string; categories?: string[] }): Promise<Article[]>;
  getArticlesByIds(ids: string[]): Promise<Article[]>;
  getArticleById(id: string): Promise<Article | null>;
  incrementArticleViews(id: string): Promise<void>;
  getBreakingArticles(): Promise<Article[]>;
  getTrendingArticles(): Promise<Article[]>;
  addArticle(article: Article): Promise<void>;
  updateArticle(article: Article): Promise<void>;
  deleteArticle(id: string): Promise<void>;

  getMatches(): Promise<Match[]>;
  getLeagues(): Promise<League[]>;
  addLeague(league: League): Promise<void>;
  updateLeague(league: League): Promise<void>;
  deleteLeague(id: string): Promise<void>;
  getMatchById(id: string): Promise<Match | null>;
  addMatch(match: Match): Promise<void>;
  updateMatch(match: Match): Promise<void>;
  deleteMatch(id: string): Promise<void>;
  getMatchDetails(matchId: string): Promise<MatchDetails | null>;

  getStandings(league?: string): Promise<Standing[]>;

  getClubs(): Promise<ClubProfile[]>;
  getClubById(id: string): Promise<ClubProfile | null>;
  getTeamFollowerCount(teamName: string): Promise<number>;
  addClub(club: ClubProfile): Promise<void>;
  updateClub(club: ClubProfile): Promise<void>;
  deleteClub(id: string): Promise<void>;

  getPlayerById(clubId: string, playerId: string): Promise<{ player: Player; club: ClubProfile } | null>;

  getCommentsForArticle(articleId: string): Promise<Comment[]>;
  getAllComments(): Promise<Comment[]>;
  addComment(comment: { articleId: string; userId: string; text: string; parentId?: string }): Promise<Comment>;
  updateCommentStatus(id: string, status: Comment['status']): Promise<void>;

  getUsers(): Promise<User[]>;
  updateUserStatus(id: string, status: 'active' | 'banned'): Promise<void>;
  deleteUser(id: string): Promise<void>;

  getSponsors(): Promise<Sponsor[]>;
  addSponsor(sponsor: Sponsor): Promise<void>;
  updateSponsor(sponsor: Sponsor): Promise<void>;
  deleteSponsor(id: string): Promise<void>;

  getSeoSettings(): Promise<SeoSettings>;
  updateSeoSettings(settings: SeoSettings): Promise<void>;

  getAdSlots(): Promise<AdSlot[]>;
  addAdSlot(slot: AdSlot): Promise<void>;
  updateAdSlot(slot: AdSlot): Promise<void>;
  deleteAdSlot(id: string): Promise<void>;
  getAdsGlobalSettings(): Promise<AdsGlobalSettings>;
  updateAdsGlobalSettings(settings: AdsGlobalSettings): Promise<void>;

  getFeatureFlags(): Promise<FeatureFlags>;
  setFeatureFlag(key: keyof FeatureFlags, value: boolean): Promise<void>;

  // Community: match-result predictions + points leaderboard
  submitPrediction(prediction: Prediction): Promise<void>;
  getPredictionForUserMatch(matchId: string, userId: string): Promise<Prediction | null>;
  getPredictionsForMatch(matchId: string): Promise<Prediction[]>;
  getLeaderboard(): Promise<LeaderboardEntry[]>;

  // Community: opinion polls
  getActivePoll(): Promise<Poll | null>;
  votePoll(pollId: string, optionId: string, userId: string): Promise<Poll>;
  hasUserVotedPoll(pollId: string, userId: string): Promise<boolean>;

  // Player career data (transfers/injuries/awards) and coach career history.
  // ⚠️ Real, complete data for every player/coach requires a live provider
  // (e.g. API-Football). What's here is a demo shape + a couple of
  // illustrative examples so the UI and data contract are ready.
  getPlayerCareerData(clubId: string, playerId: string): Promise<{
    transfers: TransferRecord[];
    injuries: InjuryRecord[];
    awards: AwardRecord[];
  }>;
  getCoachCareer(clubId: string): Promise<CoachCareerEntry[]>;

  // User preferences — previously client-only state, now persisted so
  // they survive login/logout and page refresh.
  getFollowedTeams(userId: string): Promise<string[]>;
  toggleFollowedTeam(userId: string, teamName: string): Promise<void>;
  getFollowedLeagues(userId: string): Promise<string[]>;
  toggleFollowedLeague(userId: string, league: string): Promise<void>;
  getFavorites(userId: string): Promise<string[]>;
  toggleFavoriteArticle(userId: string, articleId: string): Promise<void>;
  getActivityLog(userId: string): Promise<{ id: string; text: string; time: string }[]>;
  logActivity(userId: string, text: string): Promise<void>;
  getDreamSquad(userId: string): Promise<Record<number, DreamSquadPlayer>>;
  updateDreamSquad(userId: string, squad: Record<number, DreamSquadPlayer>): Promise<void>;
}
