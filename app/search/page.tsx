import type { Metadata } from 'next';
import { SearchX } from 'lucide-react';
import { data } from '@/lib/data';
import NewsCard from '@/components/NewsCard';

// A shareable, indexable URL for search results — the header's
// SearchModal is JS-only and shows at most 5 quick-preview results,
// so nothing about a search was ever a real page Google could crawl
// or a link a person could send someone else. This is that page.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `نتائج البحث عن "${q}"` : 'البحث' };
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = q?.trim() ?? '';
  const results = query ? await data.searchArticles(query) : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-[var(--fg)] mb-2">
        {query ? (
          <>
            نتائج البحث عن <span className="text-primary">&quot;{query}&quot;</span>
          </>
        ) : (
          'البحث'
        )}
      </h1>

      {query && <p className="text-sm text-[var(--fg-subtle)] mb-8">{results.length} نتيجة</p>}

      {!query && (
        <p className="text-[var(--fg-subtle)] mb-8">استخدم أيقونة البحث في الأعلى، أو الرابط بصيغة ?q=كلمة البحث.</p>
      )}

      {query && results.length === 0 && (
        <div className="text-center py-20 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] border-dashed">
          <SearchX className="mx-auto mb-4 text-[var(--fg-faint)]" size={40} />
          <p className="text-[var(--fg-faint)]">لا توجد نتائج مطابقة لـ &quot;{query}&quot;.</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {results.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
