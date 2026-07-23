import Link from 'next/link';
import Image from 'next/image';
import { PlayCircle, Clock } from 'lucide-react';
import { data } from '@/lib/data';
import { Category } from '@/types';

// This page reads live data (scores, standings, leaderboard...) that
// changes constantly, so it must be rendered fresh on every request
// rather than cached as a static page at build time.
export const dynamic = 'force-dynamic';

export default async function VideosPage() {
  const articles = await data.getArticles();
  const videos = articles.filter((a) => a.category === Category.VIDEO);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-black text-[var(--fg)] mb-8 flex items-center border-r-4 border-red-600 pr-4">
        <PlayCircle className="ml-3 text-red-600" size={32} />
        أحدث الفيديوهات والملخصات
      </h1>
      {videos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {videos.map((video) => (
            <Link
              href={`/article/${video.id}`}
              key={video.id}
              className="bg-[var(--bg-surface)] rounded-xl overflow-hidden border border-[var(--border-subtle)] hover:border-red-900/50 transition-all shadow-lg group"
            >
              <div className="relative aspect-video bg-black">
                {video.videoEmbedId ? (
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${video.videoEmbedId}`}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--fg-faint)]">
                    <Image src={video.imageUrl} alt={video.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover opacity-50" />
                    <PlayCircle size={48} className="absolute text-[var(--fg)]" />
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] bg-red-600/20 text-red-500 px-2 py-1 rounded font-bold">ملخص</span>
                  <div className="flex items-center text-xs text-[var(--fg-faint)]">
                    <Clock size={12} className="ml-1" />
                    <span>{new Date(video.date).toLocaleDateString('ar-SA')}</span>
                  </div>
                </div>
                <h3 className="font-bold text-[var(--fg)] text-lg line-clamp-2 mb-2 group-hover:text-red-500 transition-colors">{video.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] border-dashed">
          <p className="text-[var(--fg-faint)]">لا يوجد محتوى فيديو متاح حالياً.</p>
        </div>
      )}
    </div>
  );
}
