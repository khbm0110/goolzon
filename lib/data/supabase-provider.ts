import { createClient } from '@/lib/supabase/client';
import { createPublicClient } from '@/lib/supabase/public';
import { createAdminClient } from '@/lib/supabase/admin';
import type { DataProvider } from './provider';
import type { Article, Match, Standing, ClubProfile, Comment, User, Sponsor, SeoSettings, FeatureFlags, Player, MatchDetails, AdSlot, AdsGlobalSettings } from '@/types';
import type { Prediction, LeaderboardEntry, Poll, TransferRecord, InjuryRecord, AwardRecord, CoachCareerEntry } from '@/types/community';

// Runs in both server and client contexts. Server Components in this
// app only ever do PUBLIC reads (articles, matches, clubs, standings —
// all "using (true)" in RLS), so they use the plain anon client with no
// session/cookie handling at all. Client Components use the browser
// client, which has the real logged-in user's session, so RLS applies
// correctly for personal data (predictions, favorites, comments...).
//
// Deliberately does NOT import lib/supabase/server.ts here (or anywhere
// in this file) — that file imports next/headers, which breaks the
// production build for every Client Component that transitively
// imports this provider (which is nearly all of them, via lib/data).
async function getClient() {
  if (typeof window === 'undefined') {
    return createPublicClient();
  }
  return createClient();
}

function mapArticle(row: any): Article {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    content: row.content,
    category: row.category,
    imageUrl: row.image_url,
    isBreaking: row.is_breaking,
    views: row.views,
    author: row.author,
    videoEmbedId: row.video_embed_id,
    date: row.date,
  };
}

function mapMatch(row: any): Match {
  return {
    id: row.id,
    homeTeam: row.home_team,
    homeLogo: row.home_logo,
    awayTeam: row.away_team,
    awayLogo: row.away_logo,
    scoreHome: row.score_home,
    scoreAway: row.score_away,
    time: row.time,
    status: row.status,
    league: row.league,
    country: row.country,
    date: row.date,
    round: row.round,
    venue: row.venue,
  };
}

function mapStanding(row: any): Standing {
  return {
    rank: row.rank,
    team: row.team,
    logo: row.logo,
    played: row.played,
    won: row.won,
    drawn: row.drawn,
    lost: row.lost,
    gf: row.gf,
    ga: row.ga,
    gd: row.gd,
    points: row.points,
    league: row.league,
  };
}

function mapPlayer(row: any): Player {
  return {
    id: row.id,
    name: row.name,
    englishName: row.english_name,
    age: row.age,
    birthDate: row.birth_date,
    birthPlace: row.birth_place,
    heightCm: row.height_cm,
    weightKg: row.weight_kg,
    preferredFoot: row.preferred_foot,
    number: row.number,
    position: row.position,
    rating: row.rating,
    nationality: row.nationality,
    image: row.image,
    marketValue: row.market_value,
    stats: row.stats,
    seasonStats: row.season_stats,
  };
}

function mapClub(row: any, players: any[] = [], trophies: any[] = []): ClubProfile {
  return {
    id: row.id,
    name: row.name,
    englishName: row.english_name,
    logo: row.logo,
    coverImage: row.cover_image,
    founded: row.founded,
    stadium: row.stadium,
    coach: row.coach,
    nickname: row.nickname,
    colors: row.colors,
    social: row.social,
    fanCount: row.fan_count,
    country: row.country,
    history: row.history_text,
    squad: players.map(mapPlayer),
    trophies: trophies.map((t) => ({ name: t.name, count: t.count })),
  } as ClubProfile;
}

function mapComment(row: any): Comment {
  return {
    id: row.id,
    user: row.profiles?.name ?? row.user_id,
    avatar: row.profiles?.avatar ?? '',
    time: row.created_at,
    text: row.text,
    likes: row.likes,
    articleId: row.article_id,
    status: row.status,
    parentId: row.parent_id ?? undefined,
  };
}

function mapUser(row: any): User {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    email: row.email,
    avatar: row.avatar,
    joinDate: row.join_date,
    role: row.role,
    status: row.status,
  };
}

export const supabaseProvider: DataProvider = {
  async getArticles() {
    const supabase = await getClient();
    const { data, error } = await supabase.from('articles').select('*').order('date', { ascending: false });
    if (error) {
      console.error('getArticles failed:', error.message);
      return [];
    }
    return (data ?? []).map(mapArticle);
  },
  async getArticleById(id) {
    const supabase = await getClient();
    const { data } = await supabase.from('articles').select('*').eq('id', id).maybeSingle();
    return data ? mapArticle(data) : null;
  },
  async getBreakingArticles() {
    const supabase = await getClient();
    const { data } = await supabase.from('articles').select('*').eq('is_breaking', true).order('date', { ascending: false });
    return (data ?? []).map(mapArticle);
  },
  async getTrendingArticles() {
    const supabase = await getClient();
    const { data } = await supabase.from('articles').select('*').order('views', { ascending: false }).limit(6);
    return (data ?? []).map(mapArticle);
  },
  async addArticle(article) {
    const supabase = await getClient();
    const { error } = await supabase.from('articles').insert({
      id: article.id,
      title: article.title,
      summary: article.summary,
      content: article.content,
      category: article.category,
      image_url: article.imageUrl,
      is_breaking: article.isBreaking,
      views: article.views,
      author: article.author,
      video_embed_id: article.videoEmbedId,
      date: article.date,
    });
    if (error) throw error;
  },
  async updateArticle(article) {
    const supabase = await getClient();
    const { error } = await supabase
      .from('articles')
      .update({
        title: article.title,
        summary: article.summary,
        content: article.content,
        category: article.category,
        image_url: article.imageUrl,
        is_breaking: article.isBreaking,
      })
      .eq('id', article.id);
    if (error) throw error;
  },
  async deleteArticle(id) {
    const supabase = await getClient();
    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (error) throw error;
  },

  async getMatches() {
    const supabase = await getClient();
    const { data } = await supabase.from('matches').select('*');
    return (data ?? []).map(mapMatch);
  },
  async getMatchById(id) {
    const supabase = await getClient();
    const { data } = await supabase.from('matches').select('*').eq('id', id).maybeSingle();
    return data ? mapMatch(data) : null;
  },
  async getMatchDetails(matchId) {
    const supabase = await getClient();
    const { data } = await supabase.from('match_details').select('*').eq('match_id', matchId).maybeSingle();
    if (!data) return null;
    return { stats: data.stats, lineups: data.lineups, events: data.events, summary: data.summary } as MatchDetails;
  },

  async getStandings(league) {
    const supabase = await getClient();
    let query = supabase.from('standings').select('*').order('rank', { ascending: true });
    if (league) query = query.eq('league', league);
    const { data } = await query;
    return (data ?? []).map(mapStanding);
  },

  async getClubs() {
    const supabase = await getClient();
    const { data: clubs } = await supabase.from('clubs').select('*');
    if (!clubs) return [];
    const { data: players } = await supabase.from('players').select('*');
    const { data: trophies } = await supabase.from('trophies').select('*');
    return clubs.map((c) =>
      mapClub(
        c,
        (players ?? []).filter((p) => p.club_id === c.id),
        (trophies ?? []).filter((t) => t.club_id === c.id)
      )
    );
  },
  async getClubById(id) {
    const supabase = await getClient();
    const { data: club } = await supabase.from('clubs').select('*').eq('id', id).maybeSingle();
    if (!club) return null;
    const { data: players } = await supabase.from('players').select('*').eq('club_id', id);
    const { data: trophies } = await supabase.from('trophies').select('*').eq('club_id', id);
    return mapClub(club, players ?? [], trophies ?? []);
  },
  async addClub(club) {
    const supabase = await getClient();
    const { error } = await supabase.from('clubs').insert({
      id: club.id,
      name: club.name,
      english_name: club.englishName,
      logo: club.logo,
      cover_image: club.coverImage,
      founded: club.founded,
      stadium: club.stadium,
      coach: club.coach,
      nickname: club.nickname,
      colors: club.colors,
      social: club.social,
      fan_count: club.fanCount,
      country: club.country,
      history_text: club.history,
    });
    if (error) throw error;
  },
  async updateClub(club) {
    const supabase = await getClient();
    const { error } = await supabase
      .from('clubs')
      .update({
        name: club.name,
        english_name: club.englishName,
        logo: club.logo,
        cover_image: club.coverImage,
        founded: club.founded,
        stadium: club.stadium,
        coach: club.coach,
        nickname: club.nickname,
        colors: club.colors,
        fan_count: club.fanCount,
        country: club.country,
        history_text: club.history,
      })
      .eq('id', club.id);
    if (error) throw error;
  },
  async deleteClub(id) {
    const supabase = await getClient();
    const { error } = await supabase.from('clubs').delete().eq('id', id);
    if (error) throw error;
  },

  async getPlayerById(clubId, playerId) {
    const supabase = await getClient();
    const { data: player } = await supabase.from('players').select('*').eq('club_id', clubId).eq('id', playerId).maybeSingle();
    if (!player) return null;
    const club = await this.getClubById(clubId);
    if (!club) return null;
    return { player: mapPlayer(player), club };
  },

  async getCommentsForArticle(articleId) {
    const supabase = await getClient();
    const { data } = await supabase.from('comments').select('*, profiles(name, avatar)').eq('article_id', articleId).order('created_at', { ascending: true });
    return (data ?? []).map(mapComment);
  },
  async getAllComments() {
    const supabase = await getClient();
    const { data } = await supabase.from('comments').select('*, profiles(name, avatar)').order('created_at', { ascending: false });
    return (data ?? []).map(mapComment);
  },
  async addComment({ articleId, userId, text, parentId }) {
    const supabase = await getClient();
    const { data, error } = await supabase
      .from('comments')
      .insert({ article_id: articleId, user_id: userId, text, parent_id: parentId })
      .select('*, profiles(name, avatar)')
      .single();
    if (error) throw error;
    return mapComment(data);
  },
  async updateCommentStatus(id, status) {
    const supabase = await getClient();
    const { error } = await supabase.from('comments').update({ status }).eq('id', id);
    if (error) throw error;
  },

  async getUsers() {
    const supabase = await getClient();
    const { data } = await supabase.from('profiles').select('*').order('join_date', { ascending: false });
    return (data ?? []).map(mapUser);
  },
  async updateUserStatus(id, status) {
    // Banning/unbanning is just a `profiles.status` update — the RLS
    // policy "update own profile" already allows admins to update any
    // profile (`auth.uid() = id or public.is_admin()`), so this can go
    // through the regular client. No service-role key needed here.
    const supabase = await getClient();
    const { error } = await supabase.from('profiles').update({ status }).eq('id', id);
    if (error) throw error;
  },
  async deleteUser(id) {
    // Deleting an auth.users row requires the Supabase Admin API, which
    // ALWAYS requires the service-role key — that key must never reach
    // the browser. If this runs on the server we can use it directly;
    // if it runs in the browser, it calls a server-only Route Handler
    // instead (see app/api/admin/delete-user/route.ts).
    if (typeof window === 'undefined') {
      const admin = createAdminClient();
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) throw error;
      return;
    }
    const res = await fetch('/api/admin/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: id }),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete user');
  },

  async getSponsors() {
    const supabase = await getClient();
    const { data } = await supabase.from('sponsors').select('*');
    return (data ?? []) as Sponsor[];
  },
  async addSponsor(sponsor) {
    const supabase = await getClient();
    const { error } = await supabase.from('sponsors').insert(sponsor);
    if (error) throw error;
  },
  async updateSponsor(sponsor) {
    const supabase = await getClient();
    const { error } = await supabase.from('sponsors').update(sponsor).eq('id', sponsor.id);
    if (error) throw error;
  },
  async deleteSponsor(id) {
    const supabase = await getClient();
    const { error } = await supabase.from('sponsors').delete().eq('id', id);
    if (error) throw error;
  },

  async getSeoSettings() {
    const supabase = await getClient();
    const { data } = await supabase.from('seo_settings').select('*').eq('id', 1).single();
    return {
      siteTitle: data?.site_title ?? '',
      metaDescription: data?.meta_description ?? '',
      metaKeywords: data?.meta_keywords ?? '',
      ogImageUrl: data?.og_image_url ?? '',
    };
  },
  async updateSeoSettings(settings) {
    const supabase = await getClient();
    const { error } = await supabase
      .from('seo_settings')
      .update({
        site_title: settings.siteTitle,
        meta_description: settings.metaDescription,
        meta_keywords: settings.metaKeywords,
        og_image_url: settings.ogImageUrl,
      })
      .eq('id', 1);
    if (error) throw error;
  },

  async getAdSlots() {
    const supabase = await getClient();
    const { data } = await supabase.from('ad_slots').select('*').order('placement');
    return (data ?? []).map((row: any) => ({
      id: row.id,
      placement: row.placement,
      label: row.label,
      network: row.network,
      code: row.code,
      enabled: row.enabled,
      pages: row.pages ?? ['all'],
      startDate: row.start_date,
      endDate: row.end_date,
      updatedAt: row.updated_at,
    })) as AdSlot[];
  },
  async addAdSlot(slot) {
    const supabase = await getClient();
    const { error } = await supabase.from('ad_slots').insert({
      id: slot.id,
      placement: slot.placement,
      label: slot.label,
      network: slot.network,
      code: slot.code,
      enabled: slot.enabled,
      pages: slot.pages,
      start_date: slot.startDate || null,
      end_date: slot.endDate || null,
    });
    if (error) throw error;
  },
  async updateAdSlot(slot) {
    const supabase = await getClient();
    const { error } = await supabase
      .from('ad_slots')
      .update({
        placement: slot.placement,
        label: slot.label,
        network: slot.network,
        code: slot.code,
        enabled: slot.enabled,
        pages: slot.pages,
        start_date: slot.startDate || null,
        end_date: slot.endDate || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', slot.id);
    if (error) throw error;
  },
  async deleteAdSlot(id) {
    const supabase = await getClient();
    const { error } = await supabase.from('ad_slots').delete().eq('id', id);
    if (error) throw error;
  },

  async getAdsGlobalSettings() {
    const supabase = await getClient();
    const { data } = await supabase.from('ads_global_settings').select('*').eq('id', 1).single();
    return {
      masterEnabled: data?.master_enabled ?? true,
      adsTxtContent: data?.ads_txt_content ?? '',
    } as AdsGlobalSettings;
  },
  async updateAdsGlobalSettings(settings) {
    const supabase = await getClient();
    const { error } = await supabase
      .from('ads_global_settings')
      .update({ master_enabled: settings.masterEnabled, ads_txt_content: settings.adsTxtContent })
      .eq('id', 1);
    if (error) throw error;
  },

  async getFeatureFlags() {
    const supabase = await getClient();
    const { data } = await supabase.from('feature_flags').select('*').eq('id', 1).single();
    return {
      matches: data?.matches ?? true,
      clubs: data?.clubs ?? true,
      videos: data?.videos ?? true,
      analysis: data?.analysis ?? true,
      autopilot: data?.autopilot ?? false,
      userSystem: data?.user_system ?? true,
    };
  },
  async setFeatureFlag(key, value) {
    const columnMap: Record<string, string> = { userSystem: 'user_system' };
    const column = columnMap[key] || key;
    const supabase = await getClient();
    const { error } = await supabase.from('feature_flags').update({ [column]: value }).eq('id', 1);
    if (error) throw error;
  },

  async submitPrediction(prediction) {
    const supabase = await getClient();
    const { error } = await supabase.from('predictions').upsert({
      match_id: prediction.matchId,
      user_id: prediction.userId,
      predicted_home: prediction.predictedHome,
      predicted_away: prediction.predictedAway,
    });
    if (error) throw error;
  },
  async getPredictionForUserMatch(matchId, userId) {
    const supabase = await getClient();
    const { data } = await supabase.from('predictions').select('*').eq('match_id', matchId).eq('user_id', userId).maybeSingle();
    if (!data) return null;
    return { matchId: data.match_id, userId: data.user_id, username: '', predictedHome: data.predicted_home, predictedAway: data.predicted_away };
  },
  async getPredictionsForMatch(matchId) {
    const supabase = await getClient();
    const { data } = await supabase.from('predictions').select('*').eq('match_id', matchId);
    return (data ?? []).map((p) => ({
      matchId: p.match_id,
      userId: p.user_id,
      username: '',
      predictedHome: p.predicted_home,
      predictedAway: p.predicted_away,
    }));
  },
  async getLeaderboard() {
    // Aggregating points across all predictions is cheaper done in a
    // Postgres function/view than pulled client-side — see
    // supabase/schema.sql if you want to add a `leaderboard` SQL view.
    // For now this does the join + calculation in JS.
    const supabase = await getClient();
    const { data: predictions } = await supabase.from('predictions').select('*, profiles(name, username, avatar)');
    const { data: matches } = await supabase.from('matches').select('*').eq('status', 'FINISHED');
    if (!predictions || !matches) return [];

    const matchMap = new Map(matches.map((m) => [m.id, m]));
    const byUser = new Map<string, LeaderboardEntry>();

    for (const p of predictions) {
      const match = matchMap.get(p.match_id);
      if (!match) continue;
      const exact = p.predicted_home === match.score_home && p.predicted_away === match.score_away;
      const actualResult = Math.sign((match.score_home ?? 0) - (match.score_away ?? 0));
      const predictedResult = Math.sign(p.predicted_home - p.predicted_away);
      const points = exact ? 3 : actualResult === predictedResult ? 1 : 0;

      const existing = byUser.get(p.user_id) || {
        userId: p.user_id,
        username: p.profiles?.username ?? '',
        name: p.profiles?.name ?? '',
        avatar: p.profiles?.avatar,
        totalPoints: 0,
        predictionsCount: 0,
      };
      existing.totalPoints += points;
      existing.predictionsCount += 1;
      byUser.set(p.user_id, existing);
    }

    return Array.from(byUser.values()).sort((a, b) => b.totalPoints - a.totalPoints);
  },

  async getActivePoll() {
    const supabase = await getClient();
    const { data: poll } = await supabase.from('polls').select('*').eq('active', true).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (!poll) return null;
    const { data: options } = await supabase.from('poll_options').select('*').eq('poll_id', poll.id);
    return { id: poll.id, question: poll.question, options: (options ?? []).map((o) => ({ id: o.id, label: o.label, votes: o.votes })) } as Poll;
  },
  async votePoll(pollId, optionId, userId) {
    const supabase = await getClient();
    const { error } = await supabase.from('poll_votes').insert({ poll_id: pollId, option_id: optionId, user_id: userId });
    if (!error) {
      await supabase.rpc('increment_poll_vote', { option_id_input: optionId }).then(() => {});
    }
    const { data: options } = await supabase.from('poll_options').select('*').eq('poll_id', pollId);
    const { data: poll } = await supabase.from('polls').select('*').eq('id', pollId).single();
    return { id: pollId, question: poll?.question ?? '', options: (options ?? []).map((o) => ({ id: o.id, label: o.label, votes: o.votes })) };
  },
  async hasUserVotedPoll(pollId, userId) {
    const supabase = await getClient();
    const { data } = await supabase.from('poll_votes').select('poll_id').eq('poll_id', pollId).eq('user_id', userId).maybeSingle();
    return !!data;
  },

  async getPlayerCareerData(clubId, playerId) {
    const supabase = await getClient();
    const [{ data: transfers }, { data: injuries }, { data: awards }] = await Promise.all([
      supabase.from('player_transfers').select('*').eq('club_id', clubId).eq('player_id', playerId),
      supabase.from('player_injuries').select('*').eq('club_id', clubId).eq('player_id', playerId),
      supabase.from('player_awards').select('*').eq('club_id', clubId).eq('player_id', playerId),
    ]);
    return {
      transfers: (transfers ?? []).map((t): TransferRecord => ({ season: t.season, from: t.from_club, to: t.to_club, type: t.type })),
      injuries: (injuries ?? []).map((i): InjuryRecord => ({ date: i.injury_date, type: i.type, status: i.status, expectedReturn: i.expected_return })),
      awards: (awards ?? []).map((a): AwardRecord => ({ title: a.title, season: a.season })),
    };
  },
  async getCoachCareer(clubId) {
    const supabase = await getClient();
    const { data } = await supabase.from('coach_career').select('*').eq('club_id', clubId).order('from_year', { ascending: false });
    return (data ?? []).map((c): CoachCareerEntry => ({ club: c.coach_club, from: c.from_year, to: c.to_year, achievement: c.achievement }));
  },

  async getFollowedTeams(userId) {
    const supabase = await getClient();
    const { data } = await supabase.from('followed_teams').select('team_name').eq('user_id', userId);
    return (data ?? []).map((r) => r.team_name);
  },
  async toggleFollowedTeam(userId, teamName) {
    const supabase = await getClient();
    const { data: existing } = await supabase.from('followed_teams').select('*').eq('user_id', userId).eq('team_name', teamName).maybeSingle();
    if (existing) {
      await supabase.from('followed_teams').delete().eq('user_id', userId).eq('team_name', teamName);
      await this.logActivity(userId, `ألغيت متابعة ${teamName}`);
    } else {
      await supabase.from('followed_teams').insert({ user_id: userId, team_name: teamName });
      await this.logActivity(userId, `تابعت ${teamName}`);
    }
  },
  async getFollowedLeagues(userId) {
    const supabase = await getClient();
    const { data } = await supabase.from('followed_leagues').select('league').eq('user_id', userId);
    return (data ?? []).map((r) => r.league);
  },
  async toggleFollowedLeague(userId, league) {
    const supabase = await getClient();
    const { data: existing } = await supabase.from('followed_leagues').select('*').eq('user_id', userId).eq('league', league).maybeSingle();
    if (existing) {
      await supabase.from('followed_leagues').delete().eq('user_id', userId).eq('league', league);
      await this.logActivity(userId, `ألغيت متابعة ${league}`);
    } else {
      await supabase.from('followed_leagues').insert({ user_id: userId, league });
      await this.logActivity(userId, `تابعت ${league}`);
    }
  },
  async getFavorites(userId) {
    const supabase = await getClient();
    const { data } = await supabase.from('favorites').select('article_id').eq('user_id', userId);
    return (data ?? []).map((r) => r.article_id);
  },
  async toggleFavoriteArticle(userId, articleId) {
    const supabase = await getClient();
    const { data: existing } = await supabase.from('favorites').select('*').eq('user_id', userId).eq('article_id', articleId).maybeSingle();
    if (existing) {
      await supabase.from('favorites').delete().eq('user_id', userId).eq('article_id', articleId);
      await this.logActivity(userId, 'أزلت مقالاً من المفضلة');
    } else {
      await supabase.from('favorites').insert({ user_id: userId, article_id: articleId });
      await this.logActivity(userId, 'أضفت مقالاً للمفضلة');
    }
  },
  async getActivityLog(userId) {
    const supabase = await getClient();
    const { data } = await supabase.from('activity_log').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50);
    return (data ?? []).map((r) => ({ id: r.id, text: r.text, time: r.created_at }));
  },
  async logActivity(userId, text) {
    const supabase = await getClient();
    await supabase.from('activity_log').insert({ user_id: userId, text });
  },
  async getDreamSquad(userId) {
    const supabase = await getClient();
    const { data } = await supabase.from('dream_squads').select('squad').eq('user_id', userId).maybeSingle();
    return data?.squad ?? {};
  },
  async updateDreamSquad(userId, squad) {
    const supabase = await getClient();
    await supabase.from('dream_squads').upsert({ user_id: userId, squad });
  },
};
