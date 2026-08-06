import { notFound } from 'next/navigation';
import { after } from 'next/server';
import type { Metadata } from 'next';
import Image from 'next/image';
import { Clock, Eye } from 'lucide-react';
import { data } from '@/lib/data';
import { formatTimeAgo } from '@/lib/services/dateService';
import ArticleComments from '@/components/ArticleComments';
import FavoriteButton from '@/components/FavoriteButton';
import AdSlot from '@/components/AdSlot';
import NewsCard from '@/components/NewsCard';

// This page reads live data (scores, standings, leaderboard...) that
// changes constantly, so it must be rendered fresh on every request
// rather than cached as a static page at build time.
export const dynamic = 'force-dynamic';

// Per-article title/description/OG image, so a link shared on
// WhatsApp/Twitter/Facebook shows the actual article — not the generic
// site-wide fallback from the root layout.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const article = await data.getArticleById(id);
  if (!article) return {};

  return {
    title: article.title,
    description: article.summary,
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.summary,
      images: [{ url: article.imageUrl }],
      publishedTime: article.date,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.summary,
      images: [article.imageUrl],
    },
  };
}

export default async function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await data.getArticleById(id);

  if (!article) notFound();

  // Real view count, finally — nothing was ever incrementing
  // `articles.views` before this, so every article stayed at 0 forever
  // regardless of how many people actually read it. `after()` schedules
  // this to run once the response has already been sent to the
  // browser, so it never adds latency to the page itself.
  after(() => data.incrementArticleViews(article.id));

  // "قد تعجبك أيضًا": same-category articles first (most relevant, and
  // filtered at the DB level so it's cheap even with a huge articles
  // table), topped up with the latest other articles only if the
  // category doesn't have 4 on its own. Always excludes the article
  // being viewed.
  const sameCategory = (await data.getArticles({ category: article.category, limit: 5 })).filter((a) => a.id !== article.id);
  let relatedArticles = sameCategory.slice(0, 4);
  if (relatedArticles.length < 4) {
    const usedIds = new Set([article.id, ...relatedArticles.map((a) => a.id)]);
    const topUp = (await data.getArticles({ limit: 4 })).filter((a) => !usedIds.has(a.id));
    relatedArticles = [...relatedArticles, ...topUp].slice(0, 4);
  }

  const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.summary,
    image: article.imageUrl ? [article.imageUrl] : undefined,
    datePublished: article.date,
    dateModified: article.date,
    author: { '@type': 'Organization', name: article.author },
    publisher: {
      '@type': 'Organization',
      name: 'Goolzon',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/icons/icon-192.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/article/${article.id}` },
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />

      {/* Readable content (title, image, body) capped at a comfortable
          reading width — NOT centered with mx-auto, so it still starts
          right at the page's edge like the rest of the site, it just
          no longer stretches edge-to-edge on wide screens (long lines
          are hard to read, and it made the page feel like it was
          "filling the whole screen"). The "قد تعجبك أيضًا" grid below
          stays at the full site width on purpose — that one's meant to
          be wide. */}
      {/* max-w caps the reading width; me-auto (margin-inline-end) is
          what actually pins it to the RIGHT edge in RTL — a plain
          block with max-w and no margin does NOT auto-align to the
          page's RTL start on its own, direction doesn't reposition
          block boxes by itself, so without this it was hugging the
          LEFT edge instead (wrong side entirely) with the empty
          leftover space appearing on the right. me-auto (not the
          physical ml-auto) keeps this correct if the site ever adds
          an LTR page too. */}
      <div className="max-w-4xl me-auto">
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

        {/* This is the LCP element on the article page — priority skips
            lazy-loading so it doesn't compete with below-the-fold images.
            Guard against an empty imageUrl (possible since the DB column
            is nullable and supabase-provider.ts falls back to ''): passing
            src="" to next/image throws at runtime, so skip rendering it
            entirely rather than crash the whole article page over a
            missing image. */}
        {article.imageUrl && (
          <div className="relative w-full h-64 md:h-96 rounded-xl overflow-hidden mb-6">
            <Image src={article.imageUrl} alt={article.title} fill priority sizes="(max-width: 768px) 100vw, 896px" className="object-cover" />
          </div>
        )}

        <p className="text-lg text-[var(--fg-muted)] leading-relaxed mb-6 font-bold">{article.summary}</p>
        <div className="prose prose-invert max-w-none text-[var(--fg-muted)] leading-loose whitespace-pre-line mb-8">{article.content}</div>

        <AdSlot placement="IN_ARTICLE" page="article" />

        <div className="border-t border-[var(--border-subtle)] pt-6 flex items-center gap-3 flex-wrap">
          <ArticleComments articleId={article.id} />
          <FavoriteButton articleId={article.id} />
        </div>
      </div>

      {relatedArticles.length > 0 && (
        <div className="border-t border-[var(--border-subtle)] mt-8 pt-8">
          <h2 className="text-xl font-black text-[var(--fg)] mb-4">قد تعجبك أيضًا</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedArticles.map((a) => (
              <NewsCard key={a.id} article={a} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
