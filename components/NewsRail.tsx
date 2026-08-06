import Link from 'next/link';
import Image from 'next/image';
import type { Article } from '@/types';

// Deliberately a different shape from NewsCard: a horizontally-scrolling
// rail of small thumbnail+title cards (no summary/meta), the same
// pattern ESPN/BBC Sport/Sky Sports use for their secondary "trending"/
// "also in the news" rows below the main story grid — a quick-scan
// discovery strip, not a second copy of the main grid.
export default function NewsRail({ articles }: { articles: Article[] }) {
  return (
    <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1">
      {articles.map((article) => (
        <Link
          key={article.id}
          href={`/article/${article.id}`}
          className="flex-shrink-0 w-56 md:w-64 snap-start group"
        >
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-[var(--bg-surface-2)] mb-2">
            {article.imageUrl && (
              <Image
                src={article.imageUrl}
                alt={article.title}
                fill
                sizes="256px"
                className="object-cover transition-transform group-hover:scale-105"
              />
            )}
          </div>
          <h3 className="text-sm font-bold text-[var(--fg)] leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </h3>
        </Link>
      ))}
    </div>
  );
}
