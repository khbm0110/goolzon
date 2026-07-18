'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { User } from 'lucide-react';
import { data } from '@/lib/data';
import type { ClubProfile, Player } from '@/types';

// Standard 4-3-3 slot layout. Positions are percentages within each
// team's half of the pitch (0% = own goal line, 100% = halfway line).
const FORMATION_SLOTS: { group: 'GK' | 'DEF' | 'MID' | 'FWD'; x: number; y: number }[] = [
  { group: 'GK', x: 50, y: 6 },
  { group: 'DEF', x: 15, y: 24 },
  { group: 'DEF', x: 38, y: 20 },
  { group: 'DEF', x: 62, y: 20 },
  { group: 'DEF', x: 85, y: 24 },
  { group: 'MID', x: 30, y: 45 },
  { group: 'MID', x: 50, y: 40 },
  { group: 'MID', x: 70, y: 45 },
  { group: 'FWD', x: 20, y: 62 },
  { group: 'FWD', x: 50, y: 68 },
  { group: 'FWD', x: 80, y: 62 },
];

function positionGroupOf(position: Player['position']): 'GK' | 'DEF' | 'MID' | 'FWD' {
  if (position === 'GK') return 'GK';
  if (['DEF', 'CB', 'LB', 'RB'].includes(position)) return 'DEF';
  if (['MID', 'CM', 'CDM', 'CAM', 'RM', 'LM'].includes(position)) return 'MID';
  return 'FWD';
}

function assignSquadToSlots(squad: Player[]) {
  const remaining = [...squad];
  return FORMATION_SLOTS.map((slot) => {
    const idx = remaining.findIndex((p) => positionGroupOf(p.position) === slot.group);
    if (idx > -1) {
      const [player] = remaining.splice(idx, 1);
      return { slot, player };
    }
    if (remaining.length > 0) {
      const [player] = remaining.splice(0, 1);
      return { slot, player };
    }
    return { slot, player: null as Player | null };
  });
}

function TeamHalf({ club, flipped }: { club: ClubProfile | null; flipped: boolean }) {
  if (!club || !club.squad || club.squad.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--fg-faint)] text-xs h-full">
        لا تتوفر بيانات تشكيلة لهذا الفريق
      </div>
    );
  }

  const placements = assignSquadToSlots(club.squad);

  return (
    <div className="relative w-full h-full">
      {placements.map(({ slot, player }, i) => {
        const yPos = flipped ? 100 - slot.y : slot.y;
        if (!player) return null;
        return (
          <Link
            key={i}
            href={`/player/${club.id}/${player.id}`}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 group"
            style={{ left: `${slot.x}%`, top: `${yPos}%` }}
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[var(--bg-surface)] border-2 border-white/80 shadow-lg overflow-hidden flex items-center justify-center group-hover:scale-110 group-hover:border-primary transition-all">
              {player.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={player.image} alt={player.name} className="w-full h-full object-cover" />
              ) : (
                <User size={16} className="text-[var(--fg-faint)]" />
              )}
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold text-white bg-black/50 px-1.5 py-0.5 rounded whitespace-nowrap max-w-[70px] truncate">
              {player.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export default function MatchLineupPitch({ homeTeam, awayTeam }: { homeTeam: string; awayTeam: string }) {
  const [homeClub, setHomeClub] = useState<ClubProfile | null>(null);
  const [awayClub, setAwayClub] = useState<ClubProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    data.getClubs().then((clubs) => {
      setHomeClub(clubs.find((c) => c.name === homeTeam) ?? null);
      setAwayClub(clubs.find((c) => c.name === awayTeam) ?? null);
      setLoading(false);
    });
  }, [homeTeam, awayTeam]);

  if (loading) {
    return <div className="h-[500px] flex items-center justify-center text-[var(--fg-faint)] text-sm">جارٍ تحميل التشكيلة...</div>;
  }

  if (!homeClub && !awayClub) {
    return (
      <div className="text-center py-16 text-[var(--fg-faint)] text-sm">
        لا تتوفر بيانات تشكيلة لهذه المباراة حاليًا — ستظهر تلقائيًا عند ربط مزود بيانات حي (API-Football).
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs font-bold text-[var(--fg-muted)]">{homeTeam}</span>
        <span className="text-xs font-bold text-[var(--fg-muted)]">{awayTeam}</span>
      </div>

      <div className="relative w-full aspect-[3/4] sm:aspect-[4/5] bg-emerald-800 rounded-xl overflow-hidden shadow-inner">
        <div className="absolute inset-3 border-2 border-white/20 rounded pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/20 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/20 rounded-full pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[10%] border-2 border-white/20 border-t-0 pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-[10%] border-2 border-white/20 border-b-0 pointer-events-none" />

        <div className="absolute inset-x-0 top-0 h-1/2">
          <TeamHalf club={awayClub} flipped />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1/2">
          <TeamHalf club={homeClub} flipped={false} />
        </div>
      </div>

      <p className="text-[10px] text-[var(--fg-faint)] text-center mt-3">
        اضغط على أي لاعب لعرض صفحته الكاملة. التشكيلة المعروضة مبنية من قائمة الفريق — التشكيلة الأساسية الفعلية لهذه المباراة تحديدًا ستظهر عند ربط مزود بيانات حي.
      </p>
    </div>
  );
}
