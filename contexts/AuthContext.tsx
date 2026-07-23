'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/auth';
import { data } from '@/lib/data';
import type { AuthUser } from '@/lib/auth/provider';

interface AuthContextValue {
  currentUser: AuthUser | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (name: string, username: string, email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  followedTeams: string[];
  toggleFollow: (teamName: string) => void;
  followedLeagues: string[];
  toggleFollowLeague: (league: string) => void;
  favorites: string[];
  toggleFavorite: (articleId: string) => void;
  activityLog: { id: string; text: string; time: string }[];
  dreamSquad: Record<number, any>;
  updateDreamSquad: (squad: Record<number, any>) => void;
  profileLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [followedTeams, setFollowedTeams] = useState<string[]>([]);
  const [followedLeagues, setFollowedLeagues] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activityLog, setActivityLog] = useState<{ id: string; text: string; time: string }[]>([]);
  const [dreamSquad, setDreamSquad] = useState<Record<number, any>>({});

  // All preference data now lives in Postgres (see supabase/schema.sql).
  // Whenever the logged-in user changes, load their saved state; on
  // logout, clear it from memory.
  useEffect(() => {
    const unsubscribe = auth.onChange(async (user) => {
      setCurrentUser(user);
      setLoading(false);

      if (user) {
        const [teams, leagues, favs, activity, squad] = await Promise.all([
          data.getFollowedTeams(user.id),
          data.getFollowedLeagues(user.id),
          data.getFavorites(user.id),
          data.getActivityLog(user.id),
          data.getDreamSquad(user.id),
        ]);
        setFollowedTeams(teams);
        setFollowedLeagues(leagues);
        setFavorites(favs);
        setActivityLog(activity);
        setDreamSquad(squad);
      } else {
        setFollowedTeams([]);
        setFollowedLeagues([]);
        setFavorites([]);
        setActivityLog([]);
        setDreamSquad({});
      }
    });
    return unsubscribe;
  }, []);

  const value: AuthContextValue = {
    currentUser,
    isAdmin: currentUser?.role === 'admin',
    loading,
    signIn: async (email, password) => {
      const { error } = await auth.signIn(email, password);
      return { error };
    },
    signUp: async (name, username, email, password) => {
      const { error } = await auth.signUp(name, username, email, password);
      return { error };
    },
    signOut: () => auth.signOut(),

    followedTeams,
    toggleFollow: (teamName: string) => {
      if (!currentUser) return;
      const isFollowing = followedTeams.includes(teamName);
      setFollowedTeams((prev) => (isFollowing ? prev.filter((t) => t !== teamName) : [...prev, teamName]));
      data.toggleFollowedTeam(currentUser.id, teamName).then(() => data.getActivityLog(currentUser.id).then(setActivityLog));
    },

    followedLeagues,
    toggleFollowLeague: (league: string) => {
      if (!currentUser) return;
      const isFollowing = followedLeagues.includes(league);
      setFollowedLeagues((prev) => (isFollowing ? prev.filter((l) => l !== league) : [...prev, league]));
      data.toggleFollowedLeague(currentUser.id, league).then(() => data.getActivityLog(currentUser.id).then(setActivityLog));
    },

    favorites,
    toggleFavorite: (articleId: string) => {
      if (!currentUser) return;
      const isFav = favorites.includes(articleId);
      setFavorites((prev) => (isFav ? prev.filter((a) => a !== articleId) : [...prev, articleId]));
      data.toggleFavoriteArticle(currentUser.id, articleId).then(() => data.getActivityLog(currentUser.id).then(setActivityLog));
    },

    activityLog,

    dreamSquad,
    updateDreamSquad: (squad: Record<number, any>) => {
      setDreamSquad(squad);
      if (currentUser) data.updateDreamSquad(currentUser.id, squad);
    },

    profileLoading: loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
