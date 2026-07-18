import { notFound } from 'next/navigation';
import { Clock, Eye } from 'lucide-react';
import { data } from '@/lib/data';
import { formatTimeAgo } from '@/lib/services/dateService';
import ArticleComments from '@/components/ArticleComments';
import FavoriteButton from '@/components/FavoriteButton';
import AdSlot from '@/components/AdSlot';

// This page reads live data (scores, standings, leaderboard...) that
// changes constantly, so it must be rendered fresh on every request
// rather than cached as a static page at build time.
export const dynamic = 'force-dynamic';

export default async function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await data.getArticleById(id);

  if (!article) notFound();

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <span className="text-xs font-bold text-primary mb-2 block">{article.category}</span>
      <h1 className="text-2xl md:text-4xl font-black text-[var(--fg)] leading-tight mb-4">{article.title}</h1>

      <div className="flex items-center gap-4 text-sm text-[var(--fg-subtle)] mb-6 border-b border-[var(--border-subtle)] pb-4">
        <span className="flex items-center gap-1">
          <Clock size={14} /> {formatTimeAgo(article.date)}
        </span>
        <span className="flex items-center gap-1">
          <Eye size={14} /> {article.views.toLocaleString()}
        </span>
        <span>بقلم {article.author}</span>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={article.imageUrl} alt={article.title} className="w-full h-64 md:h-96 object-cover rounded-xl mb-6" />

      <p className="text-lg text-[var(--fg-muted)] leading-relaxed mb-6 font-bold">{article.summary}</p>
      <div className="prose prose-invert max-w-none text-[var(--fg-muted)] leading-loose whitespace-pre-line mb-8">{article.content}</div>

      <AdSlot placement="IN_ARTICLE" page="article" />

      <div className="border-t border-[var(--border-subtle)] pt-6 flex items-center gap-3 flex-wrap">
        <ArticleComments articleId={article.id} />
        <FavoriteButton articleId={article.id} />
      </div>
    </div>
  );
}
