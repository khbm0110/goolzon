'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Search, X, ChevronLeft } from 'lucide-react';
import type { Article } from '@/types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: Article[];
}

export default function SearchModal({ isOpen, onClose, articles }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (!isOpen) {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      return;
    }
    const searchTerms = query.toLowerCase().split(' ');
    const filtered = articles.filter((article) => {
      const title = article.title.toLowerCase();
      const content = article.content.toLowerCase();
      return searchTerms.every((term) => title.includes(term) || content.includes(term));
    });
    setResults(filtered.slice(0, 5));
  }, [query, articles]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4">
      <div className="absolute inset-0 bg-[color-mix(in_srgb,var(--bg-base)_90%,transparent)] backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-[var(--border)] flex items-center gap-3">
          <Search className="text-[var(--fg-subtle)]" size={20} />
          <input
            ref={inputRef}
            type="text"
            placeholder="ابحث عن فريق، لاعب، أو بطولة..."
            className="flex-1 bg-transparent text-[var(--fg)] placeholder-[var(--fg-faint)] text-lg outline-none font-bold"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-surface-2)] rounded-full text-[var(--fg-subtle)] hover:text-[var(--fg)] transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-2">
          {query && results.length === 0 && <div className="text-center py-10 text-[var(--fg-faint)]">لا توجد نتائج مطابقة لـ &quot;{query}&quot;</div>}

          {!query && (
            <div className="p-4">
              <span className="text-xs font-bold text-[var(--fg-faint)] mb-2 block">كلمات شائعة</span>
              <div className="flex flex-wrap gap-2">
                {['الهلال', 'النصر', 'رونالدو', 'الدوري السعودي', 'الكويت'].map((tag) => (
                  <button key={tag} onClick={() => setQuery(tag)} className="px-3 py-1 bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] text-[var(--fg-muted)] rounded-full text-sm transition-colors">
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.map((article) => (
            <Link key={article.id} href={`/article/${article.id}`} onClick={onClose} className="flex items-start gap-4 p-3 hover:bg-[color-mix(in_srgb,var(--bg-surface-2)_50%,transparent)] rounded-xl transition-colors group">
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-[var(--bg-surface-2)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-primary font-bold px-1.5 py-0.5 bg-primary/10 rounded">{article.category}</span>
                  <span className="text-[10px] text-[var(--fg-faint)]">{new Date(article.date).toLocaleDateString('ar-SA')}</span>
                </div>
                <h4 className="text-sm font-bold text-[var(--fg-muted)] group-hover:text-[var(--fg)] truncate">{article.title}</h4>
                <p className="text-xs text-[var(--fg-subtle)] line-clamp-1 mt-1">{article.summary}</p>
              </div>
              <ChevronLeft size={16} className="text-[var(--fg-faint)] mt-2" />
            </Link>
          ))}
        </div>

        {results.length > 0 && <div className="bg-[var(--bg-base)] p-2 text-center border-t border-[var(--border-subtle)] text-[10px] text-[var(--fg-faint)]">عرض {results.length} نتائج</div>}
      </div>
    </div>
  );
}
