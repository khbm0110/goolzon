'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User } from 'lucide-react';
import { data } from '@/lib/data';
import type { ClubProfile, Player, TeamLineup } from '@/types';

// Standard 4-3-3 slot layout. Positions are percentages within each
// team's half of the pitch (0% = own goal line, 100% = halfway line).
// Used as a generic fallback grid regardless of the real formation —
// good enough visually even though it doesn't map 1:1 to e.g. a 3-5-2.
const FORMATION_SLOTS: { group: 'G' | 'D' | 'M' | 'F'; x: number; y: number }[] = [
  { group: 'G', x: 50, y: 6 },
  { group: 'D', x: 15, y: 24 },
  { group: 'D', x: 38, y: 20 },
  { group: 'D', x: 62, y: 20 },
  { group: 'D', x: 85, y: 24 },
  { group: 'M', x: 30, y: 45 },
  { group: 'M', x: 50, y: 40 },
  { group: 'M', x: 70, y: 45 },
  { group: 'F', x: 20, y: 62 },
  { group: 'F', x: 50, y: 68 },
  { group: 'F', x: 80, y: 62 },
];

interface SlotPlayer {
  id: string;
  clubId: string;
  name: string;
  image?: string;
  position: 'G' | 'D' | 'M' | 'F';
}

function positionGroupOf(position: Player['position']): 'G' | 'D' | 'M' | 'F' {
  if (position === 'GK') return 'G';
  if (['DEF', 'CB', 'LB', 'RB'].includes(position)) return 'D';
  if (['MID', 'CM', 'CDM', 'CAM', 'RM', 'LM'].includes(position)) return 'M';
  return 'F';
}

function assignToSlots(players: SlotPlayer[]) {
  const remaining = [...players];
  return FORMATION_SLOTS.map((slot) => {
    const idx = remaining.findIndex((p) => p.position === slot.group);
    if (idx > -1) {
      const [player] = remaining.splice(idx, 1);
      return { slot, player };
    }
    if (remaining.length > 0) {
      const [player] = remaining.splice(0, 1);
      return { slot, player };
    }
    return { slot, player: null as SlotPlayer | null };
  });
}

function TeamHalf({ players, flipped }: { players: SlotPlayer[]; flipped: boolean }) {
  if (players.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--fg-faint)] text-xs h-full">
        لا تتوفر بيانات تشكيلة لهذا الفريق
      </div>
    );
  }

  const placements = assignToSlots(players);

  return (
    <div className="relative w-full h-full">
      {placements.map(({ slot, player }, i) => {
        const yPos = flipped ? 100 - slot.y : slot.y;
        if (!player) return null;
        return (
          <Link
            key={i}
            href={`/player/${player.clubId}/${player.id}`}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 group"
            style={{ left: `${slot.x}%`, top: `${yPos}%` }}
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[var(--bg-surface)] border-2 border-white/80 shadow-lg overflow-hidden flex items-center justify-center group-hover:scale-110 group-hover:border-primary transition-all relative">
              {player.image ? (
                <Image src={player.image} alt={player.name} fill sizes="44px" className="object-cover" />
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

function SubstitutesList({ team, label }: { team: TeamLineup; label: string }) {
  if (team.substitutes.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-bold text-[var(--fg-subtle)] mb-2">{label} — الاحتياط{team.coachName ? ` • المدرب: ${team.coachName}` : ''}</p>
      <div className="flex flex-wrap gap-2">
        {team.substitutes.map((p) => (
          <Link
            key={p.id}
            href={`/player/${team.clubId}/${p.id}`}
            className="text-xs bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] text-[var(--fg-muted)] px-2.5 py-1 rounded-full transition-colors"
          >
            {p.number != null && <span className="text-[var(--fg-faint)] ml-1">#{p.number}</span>}
            {p.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function MatchLineupPitch({
  homeTeam,
  awayTeam,
  lineups,
}: {
  homeTeam: string;
  awayTeam: string;
  homeTeamApiId?: number;
  awayTeamApiId?: number;
  lineups: { home: TeamLineup; away: TeamLineup } | null;
}) {
  const [homeClub, setHomeClub] = useState<ClubProfile | null>(null);
  const [awayClub, setAwayClub] = useState<ClubProfile | null>(null);
  const [loading, setLoading] = useState(!lineups);

  // Real per-match lineups are the whole point — only fall back to
  // pulling each club's general squad list when API-Football hasn't
  // published them yet (or this match wasn't imported from a live
  // fixture at all).
  useEffect(() => {
    if (lineups) {
      setLoading(false);
      return;
    }
    data.getClubs().then((clubs) => {
      setHomeClub(clubs.find((c) => c.name === homeTeam) ?? null);
      setAwayClub(clubs.find((c) => c.name === awayTeam) ?? null);
      setLoading(false);
    });
  }, [homeTeam, awayTeam, lineups]);

  if (loading) {
    return <div className="h-[500px] flex items-center justify-center text-[var(--fg-faint)] text-sm">جارٍ تحميل التشكيلة...</div>;
  }

  const homePlayers: SlotPlayer[] = lineups
    ? lineups.home.startXI.map((p) => ({ id: p.id, clubId: lineups.home.clubId, name: p.name, position: p.position }))
    : (homeClub?.squad ?? []).map((p) => ({ id: p.id, clubId: homeClub!.id, name: p.name, image: p.image, position: positionGroupOf(p.position) }));

  const awayPlayers: SlotPlayer[] = lineups
    ? lineups.away.startXI.map((p) => ({ id: p.id, clubId: lineups.away.clubId, name: p.name, position: p.position }))
    : (awayClub?.squad ?? []).map((p) => ({ id: p.id, clubId: awayClub!.id, name: p.name, image: p.image, position: positionGroupOf(p.position) }));

  if (homePlayers.length === 0 && awayPlayers.length === 0) {
    return (
      <div className="text-center py-16 text-[var(--fg-faint)] text-sm">
        لا تتوفر بيانات تشكيلة لهذه المباراة حاليًا — التشكيلات الرسمية تُنشر عادة قبل ٢٠-٤٠ دقيقة من الانطلاق.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs font-bold text-[var(--fg-muted)]">
          {homeTeam} {lineups?.home.formation && <span className="text-[var(--fg-faint)]">({lineups.home.formation})</span>}
        </span>
        <span className="text-xs font-bold text-[var(--fg-muted)]">
          {lineups?.away.formation && <span className="text-[var(--fg-faint)]">({lineups.away.formation})</span>} {awayTeam}
        </span>
      </div>

      <div className="relative w-full aspect-[3/4] sm:aspect-[4/5] bg-emerald-800 rounded-xl overflow-hidden shadow-inner">
        <div className="absolute inset-3 border-2 border-white/20 rounded pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/20 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/20 rounded-full pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[10%] border-2 border-white/20 border-t-0 pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-[10%] border-2 border-white/20 border-b-0 pointer-events-none" />

        <div className="absolute inset-x-0 top-0 h-1/2">
          <TeamHalf players={awayPlayers} flipped />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1/2">
          <TeamHalf players={homePlayers} flipped={false} />
        </div>
      </div>

      {lineups ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <SubstitutesList team={lineups.home} label={homeTeam} />
          <SubstitutesList team={lineups.away} label={awayTeam} />
        </div>
      ) : (
        <p className="text-[10px] text-[var(--fg-faint)] text-center mt-3">
          اضغط على أي لاعب لعرض صفحته الكاملة. التشكيلة المعروضة مبنية من قائمة الفريق العامة — التشكيلة الرسمية لهذه المباراة تحديدًا ستظهر تلقائيًا قبل الانطلاق بـ٢٠-٤٠ دقيقة.
        </p>
      )}
    </div>
  );
}
