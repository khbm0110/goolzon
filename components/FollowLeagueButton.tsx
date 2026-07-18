'use client';

import { Bell, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function FollowLeagueButton({ league }: { league: string }) {
  const { currentUser, followedLeagues, toggleFollowLeague } = useAuth();

  if (!currentUser) return null;

  const isFollowing = followedLeagues.includes(league);

  return (
    <button
      onClick={() => toggleFollowLeague(league)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
        isFollowing ? 'bg-primary/10 text-primary' : 'bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] text-[var(--fg-muted)] hover:text-[var(--fg)]'
      }`}
    >
      {isFollowing ? <Check size={16} /> : <Bell size={16} />}
      {isFollowing ? 'متابَع' : 'متابعة البطولة'}
    </button>
  );
}
