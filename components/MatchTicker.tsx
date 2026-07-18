'use client';

import Link from 'next/link';
import type { Match } from '@/types';
import TeamLogo from './TeamLogo';

interface MatchTickerProps {
  matches: Match[];
}

export default function MatchTicker({ matches }: MatchTickerProps) {
  return (
    <div className="bg-[var(--bg-base)] border-b border-[var(--border-subtle)] py-3 overflow-x-auto no-scrollbar">
      <div className="container mx-auto px-4 flex space-x-4 space-x-reverse min-w-max items-center">
        <Link href="/scores" className="flex items-center text-accent text-xs font-bold pl-4 border-l border-[var(--border-subtle)] hover:text-white transition-colors">
          <span className="animate-pulse w-2 h-2 bg-accent rounded-full ml-2"></span>
          مباريات اليوم
        </Link>

        {matches.length === 0 ? (
          <div className="text-[var(--fg-faint)] text-xs px-4">لا توجد مباريات جارية اليوم في الدوريات المختارة</div>
        ) : (
          matches.map((match) => (
            <Link
              key={match.id}
              href={`/match/${match.id}`}
              className="flex items-center bg-[var(--bg-surface)] rounded px-4 py-2 min-w-[260px] border border-[var(--border-subtle)] hover:border-primary/50 hover:bg-[var(--bg-surface-2)] transition-all group text-right"
            >
              <div className="flex flex-col items-center w-8">
                <TeamLogo src={match.homeLogo} alt={match.homeTeam} className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] text-[var(--fg-subtle)] mt-1 truncate max-w-full">{match.homeTeam}</span>
              </div>

              <div className="flex-1 flex flex-col items-center px-3">
                <div className="text-sm font-bold text-[var(--fg)] tracking-wider font-mono">
                  {match.status === 'UPCOMING' ? (
                    <span className="text-[var(--fg-faint)]">{match.time}</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>{match.scoreHome}</span>
                      <span className="text-[var(--fg-faint)]">-</span>
                      <span>{match.scoreAway}</span>
                    </div>
                  )}
                </div>
                <span className={`text-[10px] font-bold ${match.status === 'LIVE' ? 'text-red-500 animate-pulse' : 'text-[var(--fg-faint)]'}`}>
                  {match.status === 'LIVE' ? 'مباشر' : match.status === 'FINISHED' ? 'انتهت' : match.league}
                </span>
              </div>

              <div className="flex flex-col items-center w-8">
                <TeamLogo src={match.awayLogo} alt={match.awayTeam} className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] text-[var(--fg-subtle)] mt-1 truncate max-w-full">{match.awayTeam}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
