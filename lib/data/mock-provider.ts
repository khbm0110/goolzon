import type { Article, Match, Standing, ClubProfile, Comment, User, Sponsor, SeoSettings, FeatureFlags, MatchDetails, AdSlot, AdsGlobalSettings } from '@/types';
import type { Prediction, LeaderboardEntry, Poll, TransferRecord, InjuryRecord, AwardRecord, CoachCareerEntry } from '@/types/community';
import type { DataProvider } from './provider';
import {
  INITIAL_ARTICLES,
  MOCK_MATCHES,
  MOCK_STANDINGS,
  CLUB_DATABASE,
} from './seed';
import { MOCK_USERS } from './seed-users';
import { MOCK_SPONSORS, DEFAULT_SEO_SETTINGS, DEFAULT_FEATURE_FLAGS } from './seed-admin';

// ⚠️ DEVELOPMENT ONLY. All mutations below happen on plain in-memory
// arrays/objects that reset the moment the server restarts (or on every
// request in serverless environments). This is intentional: it lets us
// build and click through the full admin dashboard before Appwrite is
// wired in as the real, persistent backend in the final phase.
const articles: Article[] = [...INITIAL_ARTICLES];
const users: User[] = [...MOCK_USERS];
const comments: Comment[] = [];
const clubs: Record<string, ClubProfile> = { ...(CLUB_DATABASE as Record<string, ClubProfile>) };
const sponsors: Sponsor[] = [...MOCK_SPONSORS];
let seoSettings: SeoSettings = { ...DEFAULT_SEO_SETTINGS };
let featureFlags: FeatureFlags = { ...DEFAULT_FEATURE_FLAGS };
const adSlots: AdSlot[] = [];
let adsGlobalSettings: AdsGlobalSettings = { masterEnabled: true, adsTxtContent: '' };
const predictions: Prediction[] = [];
let activePoll: Poll = {
  id: 'poll-1',
  question: 'من هو أفضل لاعب في الدوري السعودي هذا الموسم؟',
  options: [
    { id: 'opt-1', label: 'كريستيانو رونالدو', votes: 0 },
    { id: 'opt-2', label: 'نيمار جونيور', votes: 0 },
    { id: 'opt-3', label: 'سالم الدوسري', votes: 0 },
  ],
};
const pollVoters = new Set<string>(); // "pollId:userId"

// ⚠️ DEMO DATA for only a couple of players/coaches, to show the data
// shape a real API-Football integration would fill in. Every other
// player/coach correctly returns empty arrays — that's the honest state,
// not a bug — until a live data provider is connected.
const PLAYER_CAREER_DATA: Record<string, { transfers: TransferRecord[]; injuries: InjuryRecord[]; awards: AwardRecord[] }> = {
  cr7: {
    transfers: [
      { season: '2023/2024', from: 'مانشستر يونايتد', to: 'النصر', type: 'permanent' },
      { season: '2021/2022', from: 'يوفنتوس', to: 'مانشستر يونايتد', type: 'permanent' },
    ],
    injuries: [],
    awards: [
      { title: 'أفضل هداف في الدوري السعودي', season: '2023/2024' },
    ],
  },
  ney: {
    transfers: [
      { season: '2023/2024', from: 'باريس سان جيرمان', to: 'الهلال', type: 'permanent' },
    ],
    injuries: [
      { date: '2023-10-17', type: 'إصابة في الرباط الصليبي', status: 'recovered', expectedReturn: '2024-08-01' },
    ],
    awards: [],
  },
};

const COACH_CAREER_DATA: Record<string, CoachCareerEntry[]> = {
  nassr: [
    { club: 'النصر', from: '2023', achievement: 'بطولة كأس الملك 2024' },
    { club: 'نادٍ سابق', from: '2019', to: '2023' },
  ],
};

// Per-user preference state, keyed by userId. Same in-memory caveat as
// everything else in this file.
const followedTeamsByUser = new Map<string, Set<string>>();
const followedLeaguesByUser = new Map<string, Set<string>>();
const favoritesByUser = new Map<string, Set<string>>();
const activityByUser = new Map<string, { id: string; text: string; time: string }[]>();
const dreamSquadByUser = new Map<string, Record<number, any>>();

function calculatePoints(prediction: Prediction, match: Match): number {
  if (match.scoreHome === null || match.scoreAway === null || match.scoreHome === undefined || match.scoreAway === undefined) return 0;
  if (prediction.predictedHome === match.scoreHome && prediction.predictedAway === match.scoreAway) return 3;
  const actualResult = Math.sign(match.scoreHome - match.scoreAway);
  const predictedResult = Math.sign(prediction.predictedHome - prediction.predictedAway);
  return actualResult === predictedResult ? 1 : 0;
}

function delay<T>(value: T, ms = 80): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const mockProvider: DataProvider = {
  async getArticles() {
    return delay([...articles]);
  },
  async getArticleById(id) {
    return delay(articles.find((a) => a.id === id) ?? null);
  },
  async getBreakingArticles() {
    return delay(articles.filter((a) => a.isBreaking));
  },
  async getTrendingArticles() {
    return delay([...articles].sort((a, b) => b.views - a.views).slice(0, 6));
  },
  async addArticle(article) {
    articles.unshift(article);
    return delay(undefined);
  },
  async updateArticle(article) {
    const idx = articles.findIndex((a) => a.id === article.id);
    if (idx > -1) articles[idx] = article;
    return delay(undefined);
  },
  async deleteArticle(id) {
    const idx = articles.findIndex((a) => a.id === id);
    if (idx > -1) articles.splice(idx, 1);
    return delay(undefined);
  },

  async getMatches() {
    return delay(MOCK_MATCHES as Match[]);
  },
  async getMatchById(id) {
    return delay((MOCK_MATCHES as Match[]).find((m) => m.id === id) ?? null);
  },
  async getMatchDetails(matchId) {
    // Ported from the original apiFootball.ts mock service — generic
    // placeholder stats until a real fixture-data provider is connected.
    const details: MatchDetails = {
      stats: {
        possession: 55,
        shotsHome: 12,
        shotsAway: 8,
        shotsOnTargetHome: 5,
        shotsOnTargetAway: 3,
        cornersHome: 6,
        cornersAway: 4,
      },
      lineups: {
        home: ['الحارس', 'مدافع أيمن', 'مدافع أيسر', 'قلب دفاع 1', 'قلب دفاع 2', 'وسط 1', 'وسط 2', 'وسط 3', 'مهاجم 1', 'مهاجم 2', 'مهاجم 3'],
        away: ['الحارس', 'مدافع أيمن', 'مدافع أيسر', 'قلب دفاع 1', 'قلب دفاع 2', 'وسط 1', 'وسط 2', 'وسط 3', 'مهاجم 1', 'مهاجم 2', 'مهاجم 3'],
      },
      events: [
        { time: "12'", team: 'HOME', type: 'GOAL', player: 'المهاجم الهداف' },
        { time: "34'", team: 'AWAY', type: 'YELLOW', player: 'لاعب الوسط' },
        { time: "67'", team: 'HOME', type: 'SUB', player: 'لاعب بديل' },
      ],
      summary: 'ملخص المباراة سيتم تحديثه تلقائيًا بعد ربط مزود بيانات مباريات حي.',
    };
    return delay(details, 200);
  },

  async getStandings(league) {
    const all = MOCK_STANDINGS as Standing[];
    return delay(league ? all.filter((s) => s.league === league) : all);
  },

  async getClubs() {
    return delay(Object.values(clubs).filter((c) => c.id !== 'generic'));
  },
  async getClubById(id) {
    return delay(clubs[id] ?? null);
  },
  async addClub(club) {
    clubs[club.id] = club;
    return delay(undefined);
  },
  async updateClub(club) {
    clubs[club.id] = club;
    return delay(undefined);
  },
  async deleteClub(id) {
    delete clubs[id];
    return delay(undefined);
  },

  async getPlayerById(clubId, playerId) {
    const club = clubs[clubId];
    if (!club) return delay(null);
    const player = (club.squad || []).find((p) => p.id === playerId);
    if (!player) return delay(null);
    return delay({ player, club });
  },

  async getCommentsForArticle(articleId) {
    return delay(comments.filter((c) => c.articleId === articleId));
  },
  async getAllComments() {
    return delay([...comments]);
  },
  async addComment({ articleId, userId, text, parentId }) {
    const user = users.find((u) => u.id === userId);
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      user: user?.name || 'مستخدم',
      avatar: user?.avatar || '',
      time: new Date().toISOString(),
      text,
      likes: 0,
      articleId,
      status: 'visible',
      parentId,
    };
    comments.push(newComment);
    return delay(newComment);
  },
  async updateCommentStatus(id, status) {
    const idx = comments.findIndex((c) => c.id === id);
    if (idx > -1) comments[idx] = { ...comments[idx], status };
    return delay(undefined);
  },

  async getUsers() {
    return delay([...users]);
  },
  async updateUserStatus(id, status) {
    const idx = users.findIndex((u) => u.id === id);
    if (idx > -1) users[idx] = { ...users[idx], status };
    return delay(undefined);
  },
  async deleteUser(id) {
    const idx = users.findIndex((u) => u.id === id);
    if (idx > -1) users.splice(idx, 1);
    return delay(undefined);
  },

  async getSponsors() {
    return delay([...sponsors]);
  },
  async addSponsor(sponsor) {
    sponsors.unshift(sponsor);
    return delay(undefined);
  },
  async updateSponsor(sponsor) {
    const idx = sponsors.findIndex((s) => s.id === sponsor.id);
    if (idx > -1) sponsors[idx] = sponsor;
    return delay(undefined);
  },
  async deleteSponsor(id) {
    const idx = sponsors.findIndex((s) => s.id === id);
    if (idx > -1) sponsors.splice(idx, 1);
    return delay(undefined);
  },

  async getSeoSettings() {
    return delay({ ...seoSettings });
  },
  async updateSeoSettings(settings) {
    seoSettings = settings;
    return delay(undefined);
  },

  async getAdSlots() {
    return delay([...adSlots]);
  },
  async addAdSlot(slot) {
    adSlots.unshift(slot);
    return delay(undefined);
  },
  async updateAdSlot(slot) {
    const idx = adSlots.findIndex((s) => s.id === slot.id);
    if (idx > -1) adSlots[idx] = slot;
    return delay(undefined);
  },
  async deleteAdSlot(id) {
    const idx = adSlots.findIndex((s) => s.id === id);
    if (idx > -1) adSlots.splice(idx, 1);
    return delay(undefined);
  },
  async getAdsGlobalSettings() {
    return delay({ ...adsGlobalSettings });
  },
  async updateAdsGlobalSettings(settings) {
    adsGlobalSettings = settings;
    return delay(undefined);
  },

  async getFeatureFlags() {
    return delay({ ...featureFlags });
  },
  async setFeatureFlag(key, value) {
    featureFlags = { ...featureFlags, [key]: value };
    return delay(undefined);
  },

  async submitPrediction(prediction) {
    const idx = predictions.findIndex((p) => p.matchId === prediction.matchId && p.userId === prediction.userId);
    if (idx > -1) predictions[idx] = prediction;
    else predictions.push(prediction);
    return delay(undefined);
  },
  async getPredictionForUserMatch(matchId, userId) {
    return delay(predictions.find((p) => p.matchId === matchId && p.userId === userId) ?? null);
  },
  async getPredictionsForMatch(matchId) {
    return delay(predictions.filter((p) => p.matchId === matchId));
  },
  async getLeaderboard() {
    const matches = MOCK_MATCHES as Match[];
    const byUser = new Map<string, LeaderboardEntry>();

    for (const prediction of predictions) {
      const match = matches.find((m) => m.id === prediction.matchId);
      if (!match) continue;
      const points = match.status === 'FINISHED' ? calculatePoints(prediction, match) : 0;

      const user = users.find((u) => u.id === prediction.userId);
      const existing = byUser.get(prediction.userId) || {
        userId: prediction.userId,
        username: prediction.username,
        name: user?.name || prediction.username,
        avatar: user?.avatar,
        totalPoints: 0,
        predictionsCount: 0,
      };
      existing.totalPoints += points;
      existing.predictionsCount += 1;
      byUser.set(prediction.userId, existing);
    }

    return delay(Array.from(byUser.values()).sort((a, b) => b.totalPoints - a.totalPoints));
  },

  async getActivePoll() {
    return delay({ ...activePoll, options: activePoll.options.map((o) => ({ ...o })) });
  },
  async votePoll(pollId, optionId, userId) {
    const key = `${pollId}:${userId}`;
    if (!pollVoters.has(key)) {
      const option = activePoll.options.find((o) => o.id === optionId);
      if (option) option.votes += 1;
      pollVoters.add(key);
    }
    return delay({ ...activePoll, options: activePoll.options.map((o) => ({ ...o })) });
  },
  async hasUserVotedPoll(pollId, userId) {
    return delay(pollVoters.has(`${pollId}:${userId}`));
  },

  async getPlayerCareerData(clubId, playerId) {
    return delay(PLAYER_CAREER_DATA[playerId] || { transfers: [], injuries: [], awards: [] });
  },
  async getCoachCareer(clubId) {
    return delay(COACH_CAREER_DATA[clubId] || []);
  },

  async getFollowedTeams(userId) {
    return delay(Array.from(followedTeamsByUser.get(userId) || []));
  },
  async toggleFollowedTeam(userId, teamName) {
    const set = followedTeamsByUser.get(userId) || new Set<string>();
    const wasFollowing = set.has(teamName);
    if (wasFollowing) set.delete(teamName);
    else set.add(teamName);
    followedTeamsByUser.set(userId, set);
    await this.logActivity(userId, wasFollowing ? `ألغيت متابعة ${teamName}` : `تابعت ${teamName}`);
  },
  async getFollowedLeagues(userId) {
    return delay(Array.from(followedLeaguesByUser.get(userId) || []));
  },
  async toggleFollowedLeague(userId, league) {
    const set = followedLeaguesByUser.get(userId) || new Set<string>();
    const wasFollowing = set.has(league);
    if (wasFollowing) set.delete(league);
    else set.add(league);
    followedLeaguesByUser.set(userId, set);
    await this.logActivity(userId, wasFollowing ? `ألغيت متابعة ${league}` : `تابعت ${league}`);
  },
  async getFavorites(userId) {
    return delay(Array.from(favoritesByUser.get(userId) || []));
  },
  async toggleFavoriteArticle(userId, articleId) {
    const set = favoritesByUser.get(userId) || new Set<string>();
    const wasFavorite = set.has(articleId);
    if (wasFavorite) set.delete(articleId);
    else set.add(articleId);
    favoritesByUser.set(userId, set);
    await this.logActivity(userId, wasFavorite ? 'أزلت مقالاً من المفضلة' : 'أضفت مقالاً للمفضلة');
  },
  async getActivityLog(userId) {
    return delay(activityByUser.get(userId) || []);
  },
  async logActivity(userId, text) {
    const log = activityByUser.get(userId) || [];
    log.unshift({ id: `act-${Date.now()}`, text, time: new Date().toISOString() });
    activityByUser.set(userId, log.slice(0, 50));
    return delay(undefined);
  },
  async getDreamSquad(userId) {
    return delay(dreamSquadByUser.get(userId) || {});
  },
  async updateDreamSquad(userId, squad) {
    dreamSquadByUser.set(userId, squad);
    return delay(undefined);
  },
};
