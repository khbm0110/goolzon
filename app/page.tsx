import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { data } from '@/lib/data';
import NewsCard from '@/components/NewsCard';
import NewsRail from '@/components/NewsRail';
import FollowedLeaguesNews from '@/components/FollowedLeaguesNews';
import MatchTicker from '@/components/MatchTicker';
import StandingsWidget from '@/components/StandingsWidget';
import PollWidget from '@/components/PollWidget';
import AdSlot from '@/components/AdSlot';
import { SPECIAL_CATEGORIES } from '@/types';
import { isSameCalendarDay } from '@/lib/services/dateService';

// This page reads live data (scores, standings, leaderboard...) that
// changes constantly, so it must be rendered fresh on every request
// rather than cached as a static page at build time.
export const dynamic = 'force-dynamic';

function SectionHeader({ title, link }: { title: string; link?: string }) {
  return (
    <div className="flex items-center justify-between mb-4 border-r-4 border-primary pr-3 bg-gradient-to-l from-slate-900 to-transparent p-2 rounded-r">
      <h2 className="text-xl font-black text-[var(--fg)]">{title}</h2>
      {link && (
        <Link href={link} className="text-xs text-primary hover:text-emerald-400 flex items-center transition-colors font-bold">
          المزيد <ChevronLeft size={14} />
        </Link>
      )}
    </div>
  );
}

export default async function HomePage() {
  const [articles, globalNews, matches, standings] = await Promise.all([
    data.getArticles({ limit: 30 }), // enough for featured (1) + latest (9) + side (5) with headroom
    data.getArticles({ category: SPECIAL_CATEGORIES.GLOBAL, limit: 10 }),
    data.getMatches(),
    data.getStandings(),
  ]);

  const breaking = articles.filter((a) => a.isBreaking);
  const featuredArticle = breaking[0] ?? articles[0];
  const latestNews = articles
    .filter((a) => a.id !== featuredArticle?.id && a.category !== SPECIAL_CATEGORIES.VIDEO && a.category !== SPECIAL_CATEGORIES.GLOBAL)
    .slice(0, 9);
  const sideNews = articles.filter((a) => a.id !== featuredArticle?.id).slice(0, 5);

  const today = new Date();
  const todaysMatches = matches.filter((m) => (m.date ? isSameCalendarDay(new Date(m.date), today) : false));

  return (
    <div className="pb-12">
      <MatchTicker matches={todaysMatches} />

      <div className="container mx-auto px-4">
        <AdSlot placement="HOME_TOP" page="home" />
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {featuredArticle ? (
              <NewsCard article={featuredArticle} featured />
            ) : (
              <div className="h-full w-full bg-[var(--bg-surface)] rounded-xl flex items-center justify-center text-[var(--fg-faint)]">
                لا توجد مقالات لعرضها.
              </div>
            )}
          </div>
          <div className="space-y-4">
            {sideNews.map((article) => (
              <NewsCard key={article.id} article={article} compact />
            ))}
          </div>
        </div>
      </div>

      <FollowedLeaguesNews />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 container mx-auto px-4">
        <div className="space-y-12 lg:col-span-9">
          <section>
            <SectionHeader title="آخر الأخبار" />
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {latestNews.map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          </section>

          {globalNews.length > 0 && (
            <section>
              <SectionHeader title={SPECIAL_CATEGORIES.GLOBAL} link="/country/global" />
              <NewsRail articles={globalNews} />
            </section>
          )}
        </div>

        <div className="lg:col-span-3 space-y-6">
          <StandingsWidget standings={standings} />
          <PollWidget />
        </div>
      </div>
    </div>
  );
}
