'use client';

import { Bookmark } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function FavoriteButton({ articleId }: { articleId: string }) {
  const { currentUser, favorites, toggleFavorite } = useAuth();
  const isFavorite = favorites.includes(articleId);

  if (!currentUser) return null;

  return (
    <button
      onClick={() => toggleFavorite(articleId)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
        isFavorite ? 'bg-primary/10 text-primary' : 'bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] text-[var(--fg-muted)] hover:text-[var(--fg)]'
      }`}
    >
      <Bookmark size={16} fill={isFavorite ? 'currentColor' : 'none'} />
      {isFavorite ? 'في المفضلة' : 'أضف للمفضلة'}
    </button>
  );
}
