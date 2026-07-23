import Link from 'next/link';
import Image from 'next/image';
import { Sparkles } from 'lucide-react';
import { data } from '@/lib/data';
import TeamLogo from '@/components/TeamLogo';

// This page reads live data (scores, standings, leaderboard...) that
// changes constantly, so it must be rendered fresh on every request
// rather than cached as a static page at build time.
export const dynamic = 'force-dynamic';

export default async function TopAssistsPage() {
  const clubs = await data.getClubs();

  const players = clubs
    .flatMap((club) => (club.squad || []).map((player) => ({ player, club })))
    .filter((entry) => (entry.player.seasonStats?.assists ?? 0) > 0)
    .sort((a, b) => (b.player.seasonStats?.assists ?? 0) - (a.player.seasonStats?.assists ?? 0));

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-black text-[var(--fg)] mb-8 flex items-center border-r-4 border-primary pr-4">
        <Sparkles className="ml-3 text-primary" size={32} />
        صناع الأهداف
      </h1>

      {players.length === 0 ? (
        <div className="text-center py-20 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] border-dashed text-[var(--fg-faint)]">
          لا توجد إحصائيات تمريرات حاسمة مسجلة حالياً.
        </div>
      ) : (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden divide-y divide-[var(--border-subtle)]">
          {players.map((entry, idx) => (
            <Link
              key={entry.player.id}
              href={`/player/${entry.club.id}/${entry.player.id}`}
              className="flex items-center gap-4 p-4 hover:bg-[var(--bg-surface-2)] transition-colors"
            >
              <span className={`w-8 text-center font-black ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-[var(--fg-muted)]' : idx === 2 ? 'text-amber-600' : 'text-[var(--fg-faint)]'}`}>
                #{idx + 1}
              </span>
              <div className="w-10 h-10 rounded-full bg-[var(--bg-surface-2)] overflow-hidden flex-shrink-0 border border-[var(--border-subtle)] relative">
                {entry.player.image ? (
                  <Image src={entry.player.image} alt={entry.player.name} fill sizes="40px" className="object-cover" />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[var(--fg)] truncate">{entry.player.name}</p>
                <p className="text-xs text-[var(--fg-faint)] flex items-center gap-1">
                  <TeamLogo src={entry.club.logo} alt={entry.club.name} className="w-3 h-3" /> {entry.club.name}
                </p>
              </div>
              <span className="text-2xl font-black text-primary">{entry.player.seasonStats?.assists}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
