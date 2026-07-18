'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Clock, Eye, Share2, ImageOff } from 'lucide-react';
import type { Article } from '@/types';
import { formatTimeAgo } from '@/lib/services/dateService';

interface NewsCardProps {
  article: Article;
  featured?: boolean;
  compact?: boolean;
}

export default function NewsCard({ article, featured = false, compact = false }: NewsCardProps) {
  const [imgError, setImgError] = useState(false);
  const timeAgo = formatTimeAgo(article.date);
  const fallbackImage = 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=800';

  if (compact) {
    return (
      <Link href={`/article/${article.id}`} className="flex gap-4 group mb-4 items-start">
        <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg relative bg-[var(--bg-surface-2)]">
          {!imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--fg-faint)]">
              <ImageOff size={24} />
            </div>
          )}
        </div>
        <div className="flex-1">
          <span className="text-xs font-bold text-primary mb-1 block">{article.category}</span>
          <h3 className="text-sm font-bold text-[var(--fg)] leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {article.title}
          </h3>
          <div className="flex items-center text-[10px] text-[var(--fg-faint)] mt-2">
            <Clock size={10} className="ml-1" />
            {timeAgo}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/article/${article.id}`}
      className={`group relative block overflow-hidden rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border)] transition-all duration-300 flex flex-col ${
        featured ? 'md:col-span-2 md:row-span-2' : ''
      }`}
    >
      <div className={`relative overflow-hidden flex-shrink-0 bg-[var(--bg-base)] ${featured ? 'h-64 md:h-96' : 'h-32 md:h-48'}`}>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 opacity-90" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgError ? fallbackImage : article.imageUrl}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={() => setImgError(true)}
        />
        {article.isBreaking && (
          <span className="absolute top-4 right-4 z-20 bg-red-600 text-[var(--fg)] text-xs font-bold px-3 py-1 rounded-full animate-pulse shadow-lg shadow-red-900/50">
            عاجل
          </span>
        )}
        <span className="absolute top-4 left-4 z-20 bg-[color-mix(in_srgb,var(--bg-base)_70%,transparent)] backdrop-blur-sm text-[var(--fg)] text-xs font-bold px-2 py-1 rounded border border-[var(--border)]">
          {article.category}
        </span>
      </div>

      <div className={`p-5 flex-1 flex flex-col justify-between ${featured ? 'absolute bottom-0 left-0 right-0 z-20' : ''}`}>
        <div>
          <h3
            className={`font-bold text-[var(--fg)] leading-tight mb-2 group-hover:text-primary transition-colors ${
              featured ? 'text-2xl md:text-4xl' : 'text-sm md:text-lg'
            }`}
          >
            {article.title}
          </h3>
          {featured && (
            <p className="text-[var(--fg-muted)] text-sm md:text-base line-clamp-2 mb-4 hidden md:block">{article.summary}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 mt-3">
          <div className="flex items-center justify-between text-xs text-[var(--fg-subtle)]">
            <div className="flex items-center space-x-4 space-x-reverse">
              <span className="flex items-center">
                <Clock size={12} className="ml-1" />
                {timeAgo}
              </span>
              <span className="flex items-center">
                <Eye size={12} className="ml-1" />
                {article.views.toLocaleString()}
              </span>
            </div>
            {!featured && <Share2 size={14} className="text-[var(--fg-faint)] group-hover:text-[var(--fg)] transition-colors" />}
          </div>
        </div>
      </div>
    </Link>
  );
}
