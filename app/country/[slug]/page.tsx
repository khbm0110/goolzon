import { Trophy } from 'lucide-react';
import type { Metadata } from 'next';
import { data } from '@/lib/data';
import NewsCard from '@/components/NewsCard';
import FollowLeagueButton from '@/components/FollowLeagueButton';
import { SPECIAL_CATEGORIES } from '@/types';

// This page reads live data (scores, standings, leaderboard...) that
// changes constantly, so it must be rendered fresh on every request
// rather than cached as a static page at build time.
export const dynamic = 'force-dynamic';

// 'analysis' isn't a league from the admin-managed `leagues` table —
// it's one of the fixed structural pseudo-categories, so it's resolved
// separately from the DB lookup below.
const SPECIAL_SLUGS: Record<string, string> = {
  analysis: SPECIAL_CATEGORIES.ANALYSIS,
  global: SPECIAL_CATEGORIES.GLOBAL,
  transfers: SPECIAL_CATEGORIES.TRANSFERS,
};

async function resolveCategory(slug: string): Promise<string | null> {
  if (SPECIAL_SLUGS[slug]) return SPECIAL_SLUGS[slug];
  const leagues = await data.getLeagues();
  return leagues.find((l) => l.id === slug)?.name ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const currentCategory = await resolveCategory(slug);
  if (!currentCategory) return {};

  return {
    title: currentCategory,
    description: `آخر أخبار وتحليلات ${currentCategory}: مباريات، نتائج، وترتيب الفرق.`,
  };
}

export default async function CountryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const currentCategory = (await resolveCategory(slug)) ?? SPECIAL_CATEGORIES.ANALYSIS;

  const filtered = await data.getArticles({ category: currentCategory });

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
