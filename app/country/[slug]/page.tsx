import { Trophy } from 'lucide-react';
import type { Metadata } from 'next';
import { data } from '@/lib/data';
import NewsCard from '@/components/NewsCard';
import FollowLeagueButton from '@/components/FollowLeagueButton';
import { Category } from '@/types';

// This page reads live data (scores, standings, leaderboard...) that
// changes constantly, so it must be rendered fresh on every request
// rather than cached as a static page at build time.
export const dynamic = 'force-dynamic';

const CATEGORY_MAP: Record<string, Category> = {
  saudi: Category.SAUDI,
  uae: Category.UAE,
  qatar: Category.QATAR,
  kuwait: Category.KUWAIT,
  oman: Category.OMAN,
  bahrain: Category.BAHRAIN,
  egypt: Category.EGYPT,
  algeria: Category.ALGERIA,
  tunisia: Category.TUNISIA,
  morocco: Category.MOROCCO,
  jordan: Category.JORDAN,
  iraq: Category.IRAQ,
  lebanon: Category.LEBANON,
  libya: Category.LIBYA,
  sudan: Category.SUDAN,
  yemen: Category.YEMEN,
  palestine: Category.PALESTINE,
  england: Category.ENGLAND,
  spain: Category.SPAIN,
  italy: Category.ITALY,
  germany: Category.GERMANY,
  'champions-league': Category.CHAMPIONS_LEAGUE,
  'arab-cup': Category.ARAB_CUP,
  analysis: Category.ANALYSIS,
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const currentCategory = CATEGORY_MAP[slug];
  if (!currentCategory) return {};

  return {
    title: currentCategory,
    description: `آخر أخبار وتحليلات ${currentCategory}: مباريات، نتائج، وترتيب الفرق.`,
  };
}

export default async function CountryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const currentCategory = CATEGORY_MAP[slug] || Category.SAUDI;

  const articles = await data.getArticles();
  const filtered = articles.filter((a) => a.category === currentCategory);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <span className="text-primary text-sm font-bold tracking-widest uppercase mb-1 block">تغطية خاصة</span>
          <h1 className="text-3xl md:text-5xl font-black text-[var(--fg)] mb-3">{currentCategory}</h1>
          <FollowLeagueButton league={currentCategory} />
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
