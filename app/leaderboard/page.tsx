import Image from 'next/image';
import { Trophy, Medal } from 'lucide-react';
import { data } from '@/lib/data';

// This page reads live data (scores, standings, leaderboard...) that
// changes constantly, so it must be rendered fresh on every request
// rather than cached as a static page at build time.
export const dynamic = 'force-dynamic';

export default async function LeaderboardPage() {
  const leaderboard = await data.getLeaderboard();

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-black text-[var(--fg)] mb-2 flex items-center gap-3">
        <Trophy className="text-accent" size={32} />
        ترتيب المتوقعين
      </h1>
      <p className="text-[var(--fg-subtle)] text-sm mb-8">3 نقاط للنتيجة المضبوطة، نقطة واحدة للفوز/التعادل الصحيح بدون النتيجة المضبوطة.</p>

      {leaderboard.length === 0 ? (
        <div className="text-center py-20 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] border-dashed text-[var(--fg-faint)]">
          لا توجد توقعات بعد — كن أول من يتوقع نتيجة مباراة!
        </div>
      ) : (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden divide-y divide-[var(--border-subtle)]">
          {leaderboard.map((entry, idx) => (
            <div key={entry.userId} className="flex items-center gap-4 p-4">
              <span className={`w-8 text-center font-black ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-[var(--fg-muted)]' : idx === 2 ? 'text-amber-600' : 'text-[var(--fg-faint)]'}`}>
                {idx < 3 ? <Medal size={20} className="mx-auto" /> : `#${idx + 1}`}
              </span>
              <div className="w-10 h-10 rounded-full bg-[var(--bg-surface-2)] overflow-hidden flex-shrink-0 relative">
                {entry.avatar && (
                  <Image src={entry.avatar} alt={entry.name} fill sizes="40px" className="object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[var(--fg)] truncate">{entry.name}</p>
                <p className="text-xs text-[var(--fg-faint)]">@{entry.username} • {entry.predictionsCount} توقع</p>
              </div>
              <span className="text-xl font-black text-primary">{entry.totalPoints}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
