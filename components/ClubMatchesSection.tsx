'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, MapPin, Calendar } from 'lucide-react';
import TeamLogo from '@/components/TeamLogo';
import type { Match } from '@/types';

// Built deliberately in natural Arabic day → month → year order (e.g.
// "12 يوليو 2026"), assembled as a single string ourselves rather than
// trusting a mixed LTR/RTL concatenation — that's what caused the
// reversed "2025 مايو 15" order in the reference design.
const ARABIC_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

function formatMatchDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate()} ${ARABIC_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatMatchTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: false });
}

type FilterKey = 'ALL' | 'UPCOMING' | 'PAST';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'ALL', label: 'الكل' },
  { key: 'UPCOMING', label: 'القادمة' },
  { key: 'PAST', label: 'السابقة' },
];

function MatchRow({ match, clubName }: { match: Match; clubName: string }) {
  const isPast = match.status === 'FINISHED';
  const clubIsHome = match.homeTeam === clubName;

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:border-[var(--border)] transition-colors">
      {/* Competition + round (right-most block in RTL reading order) */}
      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start sm:w-40 flex-shrink-0 order-1 text-xs">
        <span className="text-[var(--fg-subtle)] font-bold">{match.league}{match.round ? ` • ${match.round}` : ''}</span>
      </div>

      {/* Teams + score/time (center) */}
      <div className="flex items-center justify-center gap-3 flex-1 order-2">
        <span className={`font-bold text-sm sm:text-base ${clubIsHome ? 'text-primary' : 'text-[var(--fg)]'}`}>{match.homeTeam}</span>
        <TeamLogo src={match.homeLogo} alt={match.homeTeam} className="w-8 h-8 flex-shrink-0" />

        {isPast ? (
          <span className="bg-[var(--bg-surface-2)] text-[var(--fg)] font-black px-3 py-1 rounded-lg text-sm flex-shrink-0">
            {match.scoreHome} - {match.scoreAway}
          </span>
        ) : (
          <span className="text-[var(--fg-faint)] font-black text-sm flex-shrink-0">VS</span>
        )}

        <TeamLogo src={match.awayLogo} alt={match.awayTeam} className="w-8 h-8 flex-shrink-0" />
        <span className={`font-bold text-sm sm:text-base ${!clubIsHome ? 'text-primary' : 'text-[var(--fg)]'}`}>{match.awayTeam}</span>
      </div>

      {/* Date/time + venue (left-most block in RTL reading order) */}
      <div className="flex sm:flex-col items-center sm:items-start justify-between sm:justify-start sm:w-44 flex-shrink-0 order-3 text-xs gap-1">
        <span className="flex items-center gap-1 font-bold text-[var(--fg-muted)]">
          <Calendar size={11} className="text-[var(--fg-faint)]" />
          {match.date ? `${formatMatchDate(match.date)} • ${formatMatchTime(match.date)}` : match.time}
        </span>
        {match.venue && (
          <span className="flex items-center gap-1 text-[var(--fg-faint)]">
            <MapPin size={11} />
            {match.venue}
          </span>
        )}
      </div>
    </div>
  );
}

export default function ClubMatchesSection({ clubName, matches }: { clubName: string; matches: Match[] }) {
  const [filter, setFilter] = useState<FilterKey>('ALL');
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [showAllPast, setShowAllPast] = useState(false);

  const clubMatches = useMemo(() => matches.filter((m) => m.homeTeam === clubName || m.awayTeam === clubName), [matches, clubName]);

  const upcoming = clubMatches.filter((m) => m.status !== 'FINISHED');
  const past = clubMatches.filter((m) => m.status === 'FINISHED');

  const showUpcoming = filter === 'ALL' || filter === 'UPCOMING';
  const showPast = filter === 'ALL' || filter === 'PAST';

  if (clubMatches.length === 0) {
    return (
      <div className="text-center py-20 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] border-dashed text-[var(--fg-faint)]">
        لا توجد مباريات مسجلة لهذا الفريق حاليًا.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
              filter === f.key ? 'bg-primary text-white' : 'bg-[var(--bg-surface-2)] text-[var(--fg-subtle)] hover:text-[var(--fg)]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {showUpcoming && upcoming.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-black text-[var(--fg)] mb-3">المباريات القادمة</h3>
          <div className="space-y-3">
            {(showAllUpcoming ? upcoming : upcoming.slice(0, 3)).map((m) => (
              <MatchRow key={m.id} match={m} clubName={clubName} />
            ))}
          </div>
          {upcoming.length > 3 && (
            <button
              onClick={() => setShowAllUpcoming((v) => !v)}
              className="w-full flex items-center justify-center gap-1 text-primary text-xs font-bold mt-3 py-2 hover:underline"
            >
              {showAllUpcoming ? 'عرض أقل' : 'عرض المزيد'}
              <ChevronDown size={14} className={showAllUpcoming ? 'rotate-180' : ''} />
            </button>
          )}
        </div>
      )}

      {showPast && past.length > 0 && (
        <div>
          <h3 className="text-sm font-black text-[var(--fg)] mb-3">المباريات السابقة</h3>
          <div className="space-y-3">
            {(showAllPast ? past : past.slice(0, 3)).map((m) => (
              <MatchRow key={m.id} match={m} clubName={clubName} />
            ))}
          </div>
          {past.length > 3 && (
            <button
              onClick={() => setShowAllPast((v) => !v)}
              className="w-full flex items-center justify-center gap-1 text-primary text-xs font-bold mt-3 py-2 hover:underline"
            >
              {showAllPast ? 'عرض أقل' : 'عرض المزيد'}
              <ChevronDown size={14} className={showAllPast ? 'rotate-180' : ''} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
