import { Trophy } from 'lucide-react';
import { data } from '@/lib/data';
import NewsCard from '@/components/NewsCard';
import { Category } from '@/types';

// This page reads live data (scores, standings, leaderboard...) that
// changes constantly, so it must be rendered fresh on every request
// rather than cached as a static page at build time.
export const dynamic = 'force-dynamic';

export default async function AnalysisPage() {
  const articles = await data.getArticles();
  const filtered = articles.filter((a) => a.category === Category.ANALYSIS);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <span className="text-primary text-sm font-bold tracking-widest uppercase mb-1 block">تغطية خاصة</span>
          <h1 className="text-3xl md:text-5xl font-black text-[var(--fg)]">{Category.ANALYSIS}</h1>
        </div>
        <div className="hidden md:block">
          <Trophy size={48} className="text-slate-800" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] border-dashed">
          <p className="text-[var(--fg-faint)]">لا توجد أخبار حالياً في هذا القسم.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
