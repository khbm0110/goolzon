'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { data } from '@/lib/data';
import NewsRail from './NewsRail';
import type { Article } from '@/types';

// Client component (needs useAuth for the signed-in user's followed
// leagues) rendered from the server-rendered homepage — Next.js allows
// mixing the two freely. Hidden entirely for logged-out visitors, since
// "favorite news" has no meaning without an account.
export default function FollowedLeaguesNews() {
  const { currentUser, followedLeagues } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    if (followedLeagues.length === 0) {
      setArticles([]);
      return;
    }
    data.getArticles({ categories: followedLeagues, limit: 10 }).then(setArticles);
  }, [followedLeagues]);

  if (!currentUser) return null;

  return (
    <div className="container mx-auto px-4 py-6">
      <h2 className="text-xl font-black text-[var(--fg)] mb-4 flex items-center gap-2">
        <Heart size={20} className="text-primary" fill="currentColor" />
        أخبار المفضلة
      </h2>
      {followedLeagues.length === 0 ? (
        <p className="text-sm text-[var(--fg-subtle)] bg-[var(--bg-surface)] border border-dashed border-[var(--border-subtle)] rounded-xl p-4">
          تابع دوريك المفضل من صفحته لتظهر آخر أخباره هنا.
        </p>
      ) : articles.length > 0 ? (
        <NewsRail articles={articles} />
      ) : null}
    </div>
  );
}
