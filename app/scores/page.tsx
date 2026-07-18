'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Radio, Search, X, Loader2, CalendarX } from 'lucide-react';
import TeamLogo from '@/components/TeamLogo';
import { data } from '@/lib/data';
import { Category, type Match } from '@/types';
import { isSameCalendarDay, addDays } from '@/lib/services/dateService';

const ARAB_LEAGUES = [
  Category.SAUDI, Category.UAE, Category.QATAR, Category.KUWAIT, Category.OMAN, Category.BAHRAIN,
  Category.EGYPT, Category.ALGERIA, Category.TUNISIA, Category.MOROCCO, Category.JORDAN,
  Category.IRAQ, Category.LEBANON, Category.LIBYA, Category.SUDAN, Category.YEMEN, Category.PALESTINE,
];
const EURO_LEAGUES = [Category.ENGLAND, Category.SPAIN, Category.ITALY, Category.GERMANY, Category.CHAMPIONS_LEAGUE];

type Region = 'ALL' | 'ARAB' | 'EURO';
type DayKey = 'YESTERDAY' | 'TODAY' | 'TOMORROW';

const DAYS: { key: DayKey; label: string; offset: number }[] = [
  { key: 'YESTERDAY', label: 'أمس', offset: -1 },
  { key: 'TODAY', label: 'اليوم', offset: 0 },
  { key: 'TOMORROW', label: 'غدًا', offset: 1 },
];

const REGIONS: { key: Region; label: string }[] = [
  { key: 'ALL', label: 'الكل' },
  { key: 'ARAB', label: 'الدوريات العربية' },
  { key: 'EURO', label: 'الدوريات الأوروبية' },
];

function MatchLine({ match }: { match: Match }) {
  const isLive = match.status === 'LIVE';
  const isFinished = match.status === 'FINISHED';

  return (
    <Link href={`/match/${match.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-surface-2)] transition-colors">
      <div className="w-12 flex-shrink-0 text-center">
        {isLive ? (
          <span className="flex items-center justify-center gap-1 text-red-500 text-xs font-bold">
            <Radio size={10} className="animate-pulse" /> {match.time}
          </span>
        ) : (
          <span className="text-xs font-mono text-[var(--fg-faint)]">{isFinished ? 'إنتهت' : match.time}</span>
        )}
      </div>

      <div className="flex-1 flex items-center gap-2 min-w-0">
        <TeamLogo src={match.homeLogo} alt={match.homeTeam} className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm font-bold text-[var(--fg)] truncate">{match.homeTeam}</span>
      </div>

      <div className="flex-shrink-0 px-2">
        {match.status === 'UPCOMING' ? (
          <span className="text-[var(--fg-faint)] text-xs font-bold">VS</span>
        ) : (
          <span className={`font-mono font-black text-sm px-2 py-0.5 rounded ${isLive ? 'bg-red-500/10 text-red-500' : 'bg-[var(--bg-surface-2)] text-[var(--fg)]'}`}>
            {match.scoreHome} - {match.scoreAway}
          </span>
        )}
      </div>

      <div className="flex-1 flex items-center gap-2 justify-end min-w-0">
        <span className="text-sm font-bold text-[var(--fg)] truncate">{match.awayTeam}</span>
        <TeamLogo src={match.awayLogo} alt={match.awayTeam} className="w-5 h-5 flex-shrink-0" />
      </div>
    </Link>
  );
}

function LeagueGroup({ league, matches, defaultOpen }: { league: string; matches: Match[]; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const liveCount = matches.filter((m) => m.status === 'LIVE').length;

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between px-4 py-3 bg-[var(--bg-surface-2)]">
        <div className="flex items-center gap-2 min-w-0">
          {liveCount > 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />}
          <span className="font-black text-sm text-[var(--fg)] truncate">{league}</span>
          <span className="text-xs text-[var(--fg-faint)] flex-shrink-0">({matches.length})</span>
          {liveCount > 0 && (
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500 flex-shrink-0">
              {liveCount} مباشر
            </span>
          )}
        </div>
        <ChevronDown size={16} className={`text-[var(--fg-faint)] transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="divide-y divide-[var(--border-subtle)]">{matches.map((m) => <MatchLine key={m.id} match={m} />)}</div>}
    </div>
  );
}

export default function ScoresPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [region, setRegion] = useState<Region>('ALL');
  const [day, setDay] = useState<DayKey>('TODAY');
  const [query, setQuery] = useState('');

  useEffect(() => {
    data.getMatches().then((m) => {
      setMatches(m);
      setIsLoading(false);
    });
  }, []);

  const liveTodayCount = useMemo(() => {
    const today = new Date();
    return matches.filter((m) => m.status === 'LIVE' && (m.date ? isSameCalendarDay(new Date(m.date), today) : false)).length;
  }, [matches]);

  const grouped = useMemo(() => {
    const selectedDate = addDays(new Date(), DAYS.find((d) => d.key === day)!.offset);
    const q = query.trim().toLowerCase();

    const filtered = matches
      .filter((m) => (m.date ? isSameCalendarDay(new Date(m.date), selectedDate) : false))
      .filter((m) => {
        if (region === 'ARAB') return (ARAB_LEAGUES as string[]).includes(m.country);
        if (region === 'EURO') return (EURO_LEAGUES as string[]).includes(m.country);
        return true;
      })
      .filter((m) => (q === '' ? true : m.homeTeam.toLowerCase().includes(q) || m.awayTeam.toLowerCase().includes(q) || m.league.toLowerCase().includes(q)));

    const map = new Map<string, Match[]>();
    filtered.forEach((m) => {
      const key = m.league || 'مباريات أخرى';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    });

    // Leagues with a live match float to the top.
    return Array.from(map.entries()).sort(([, a], [, b]) => {
      const aLive = a.some((m) => m.status === 'LIVE') ? 1 : 0;
      const bLive = b.some((m) => m.status === 'LIVE') ? 1 : 0;
      return bLive - aLive;
    });
  }, [matches, region, day, query]);

  const totalMatches = grouped.reduce((acc, [, m]) => acc + m.length, 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-3xl font-black text-[var(--fg)] flex items-center border-r-4 border-primary pr-4">مركز النتائج</h1>
        {liveTodayCount > 0 && (
          <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-red-500/10 text-red-500">
            <Radio size={12} className="animate-pulse" /> {liveTodayCount} مباراة مباشرة الآن
          </span>
        )}
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-16 z-30 -mx-4 px-4 pb-4 md:mx-0 md:px-0 bg-[var(--bg-base)]/95 backdrop-blur border-b border-[var(--border-subtle)] mb-6 space-y-3">
        <div className="flex gap-2 pt-1">
          {DAYS.map((d) => (
            <button
              key={d.key}
              onClick={() => setDay(d.key)}
              className={`flex-1 sm:flex-none sm:px-6 py-2 rounded-lg text-sm font-bold transition-colors ${
                day === d.key ? 'bg-primary/10 text-primary border border-primary' : 'bg-[var(--bg-surface-2)] text-[var(--fg-subtle)] border border-transparent hover:text-[var(--fg)]'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {REGIONS.map((r) => (
              <button
                key={r.key}
                onClick={() => setRegion(r.key)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${
                  region === r.key ? 'bg-primary text-white' : 'bg-[var(--bg-surface-2)] text-[var(--fg-subtle)] hover:text-[var(--fg)]'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 sm:max-w-xs">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-faint)] pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن فريق أو دوري..."
              className="w-full bg-[var(--bg-surface-2)] border border-transparent focus:border-primary rounded-lg pr-9 pl-8 py-2 text-sm text-[var(--fg)] placeholder-[var(--fg-faint)] outline-none transition-colors"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--fg-faint)] hover:text-[var(--fg)]">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-[var(--fg-faint)] gap-3">
          <Loader2 size={28} className="animate-spin text-primary" />
          <span className="text-sm font-bold">جارٍ تحميل المباريات...</span>
        </div>
      ) : grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 text-center py-20 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] border-dashed text-[var(--fg-faint)]">
          <CalendarX size={32} className="text-[var(--fg-faint)]" />
          <p>{query ? 'لا توجد نتائج مطابقة لبحثك.' : 'لا توجد مباريات مسجلة حاليًا في هذا القسم.'}</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-[var(--fg-faint)] font-bold mb-3">{totalMatches} مباراة في {grouped.length} دوري</p>
          <div className="space-y-4">
            {grouped.map(([league, leagueMatches], idx) => (
              <LeagueGroup key={league} league={league} matches={leagueMatches} defaultOpen={idx < 3} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
