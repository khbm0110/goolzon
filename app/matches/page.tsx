'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { data } from '@/lib/data';
import TeamLogo from '@/components/TeamLogo';
import MatchPrediction from '@/components/MatchPrediction';
import type { Match } from '@/types';
import { isSameCalendarDay, addDays } from '@/lib/services/dateService';

type DayKey = 'YESTERDAY' | 'TODAY' | 'TOMORROW';
const DAYS: { key: DayKey; label: string; offset: number }[] = [
  { key: 'YESTERDAY', label: 'أمس', offset: -1 },
  { key: 'TODAY', label: 'اليوم', offset: 0 },
  { key: 'TOMORROW', label: 'غدًا', offset: 1 },
];

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [day, setDay] = useState<DayKey>('TODAY');

  useEffect(() => {
    data.getMatches().then(setMatches);
  }, []);

  const grouped = useMemo(() => {
    const selectedDate = addDays(new Date(), DAYS.find((d) => d.key === day)!.offset);
    const dayMatches = matches.filter((m) => (m.date ? isSameCalendarDay(new Date(m.date), selectedDate) : false));

    return dayMatches.reduce((acc: Record<string, Match[]>, match) => {
      const league = match.league || 'مباريات ودية';
      if (!acc[league]) acc[league] = [];
      acc[league].push(match);
      return acc;
    }, {});
  }, [matches, day]);

  const leagues = Object.keys(grouped);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-black text-[var(--fg)] mb-6 flex items-center border-r-4 border-primary pr-4">
        <Calendar className="ml-3 text-primary" size={32} />
        جدول المباريات
      </h1>

      <div className="flex gap-2 mb-8">
        {DAYS.map((d) => (
          <button
            key={d.key}
            onClick={() => setDay(d.key)}
            className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-colors border ${
              day === d.key ? 'text-primary border-primary bg-[var(--bg-surface-2)]' : 'text-[var(--fg-subtle)] border-transparent bg-[var(--bg-surface-2)]'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div className="space-y-8">
        {leagues.length === 0 ? (
          <div className="text-center text-[var(--fg-faint)] py-10 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)]">
            لا توجد مباريات مجدولة {day === 'TODAY' ? 'اليوم' : day === 'TOMORROW' ? 'غدًا' : 'أمس'} في الدوريات المغطاة
          </div>
        ) : (
          leagues.map((league) => {
            const leagueMatches = grouped[league];
            return (
              <div key={league} className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden shadow-lg">
                <div className="bg-gradient-to-r from-[var(--bg-surface-2)] to-[var(--bg-surface)] px-6 py-4 border-b border-[var(--border)] flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-accent rounded-full"></div>
                    <h2 className="font-bold text-[var(--fg)] text-lg">{league}</h2>
                  </div>
                  <span className="text-xs font-bold text-[var(--fg-subtle)] px-3 py-1 bg-[var(--bg-surface-2)] rounded-full border border-[var(--border)]">
                    {leagueMatches[0].country}
                  </span>
                </div>
                <div className="divide-y divide-[var(--border-subtle)]">
                  {leagueMatches.map((match) => (
                    <div key={match.id}>
                      <Link
                        href={`/match/${match.id}`}
                        className="p-5 flex flex-col md:flex-row items-center justify-between hover:bg-[color-mix(in_srgb,var(--bg-surface-2)_30%,transparent)] transition-colors gap-4 cursor-pointer group"
                      >
                        <div className="flex items-center gap-4 flex-1 w-full md:w-auto justify-end md:justify-start order-1">
                          <span className="font-bold text-[var(--fg-muted)] text-lg group-hover:text-primary transition-colors">{match.homeTeam}</span>
                          <TeamLogo src={match.homeLogo} alt={match.homeTeam} className="w-10 h-10 drop-shadow-md" />
                        </div>
                        <div className="flex flex-col items-center justify-center w-full md:w-32 order-2 bg-[var(--bg-surface)] py-2 rounded-lg border border-[var(--border-subtle)] group-hover:border-[var(--border)] transition-colors">
                          {match.status === 'UPCOMING' ? (
                            <span className="text-xl font-mono text-[var(--fg-subtle)] font-bold">{match.time}</span>
                          ) : (
                            <div className="flex items-center gap-4 text-2xl font-mono font-black text-[var(--fg)]">
                              <span>{match.scoreHome}</span>
                              <span className="text-[var(--fg-faint)]">-</span>
                              <span>{match.scoreAway}</span>
                            </div>
                          )}
                          <span className={`text-[10px] font-bold mt-1 ${match.status === 'LIVE' ? 'text-red-500 animate-pulse' : 'text-[var(--fg-faint)]'}`}>
                            {match.status === 'LIVE' ? 'مباشر الآن' : match.status === 'FINISHED' ? 'انتهت المباراة' : 'لم تبدأ'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 flex-1 w-full md:w-auto order-3">
                          <TeamLogo src={match.awayLogo} alt={match.awayTeam} className="w-10 h-10 drop-shadow-md" />
                          <span className="font-bold text-[var(--fg-muted)] text-lg group-hover:text-primary transition-colors">{match.awayTeam}</span>
                        </div>
                      </Link>
                      <MatchPrediction match={match} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
