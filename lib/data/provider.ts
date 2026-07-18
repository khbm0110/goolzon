import type { Article, Match, Standing, ClubProfile, Comment, User, Sponsor, SeoSettings, FeatureFlags, Player, MatchDetails, AdSlot, AdsGlobalSettings } from '@/types';
import type { Prediction, LeaderboardEntry, Poll, TransferRecord, InjuryRecord, AwardRecord, CoachCareerEntry } from '@/types/community';

// This is the single "contract" the whole app talks to for data.
// Right now `mock-provider.ts` implements it using local seed data
// (lib/data/seed.ts, ported from the original project). Later, when
// Appwrite is ready, we write `appwrite-provider.ts` implementing the
// exact same interface and swap ONE line in `index.ts` — no page or
// component needs to change.
export interface DataProvider {
  getArticles(): Promise<Article[]>;
  getArticleById(id: string): Promise<Article | null>;
  getBreakingArticles(): Promise<Article[]>;
  getTrendingArticles(): Promise<Article[]>;
  addArticle(article: Article): Promise<void>;
  updateArticle(article: Article): Promise<void>;
  deleteArticle(id: string): Promise<void>;

  getMatches(): Promise<Match[]>;
  getMatchById(id: string): Promise<Match | null>;
  getMatchDetails(matchId: string): Promise<MatchDetails | null>;

  getStandings(league?: string): Promise<Standing[]>;

  getClubs(): Promise<ClubProfile[]>;
  getClubById(id: string): Promise<ClubProfile | null>;
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
  getDreamSquad(userId: string): Promise<Record<number, any>>;
  updateDreamSquad(userId: string, squad: Record<number, any>): Promise<void>;
}
