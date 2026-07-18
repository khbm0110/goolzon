'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, BarChart2, Users, Share2, AlertCircle, Loader2, MapPin } from 'lucide-react';
import TeamLogo from '@/components/TeamLogo';
import MatchPrediction from '@/components/MatchPrediction';
import MatchLineupPitch from '@/components/MatchLineupPitch';
import AdSlot from '@/components/AdSlot';
import { data } from '@/lib/data';
import type { Match, MatchDetails } from '@/types';

export default function MatchCenterPage() {
  const params = useParams<{ id: string }>();
  const [match, setMatch] = useState<Match | null | undefined>(undefined);
  const [details, setDetails] = useState<MatchDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'STATS' | 'LINEUPS' | 'SUMMARY'>('STATS');

  useEffect(() => {
    if (!params?.id) return;
    setLoading(true);
    Promise.all([data.getMatchById(params.id), data.getMatchDetails(params.id)]).then(([m, d]) => {
      setMatch(m);
      setDetails(d);
      setLoading(false);
    });
  }, [params?.id]);

  if (match === undefined) {
    return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--fg-faint)]">جارٍ التحميل...</div>;
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--fg)]">
        <div className="text-center p-8 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)]">
          <h2 className="text-2xl font-bold mb-2">عذراً</h2>
          <p className="text-[var(--fg-subtle)]">بيانات هذه المباراة غير متوفرة.</p>
          <Link href="/matches" className="text-primary mt-4 inline-block font-bold hover:underline">العودة للمباريات</Link>
        </div>
      </div>
    );
  }

  const stats = details?.stats;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Link href="/matches" className="flex items-center gap-1 text-[var(--fg-subtle)] hover:text-[var(--fg)] text-sm mb-6 w-fit">
        <ArrowRight size={16} /> العودة لكل المباريات
      </Link>

      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-base)] text-sm text-[var(--fg-subtle)]">
          <span className="flex items-center gap-2"><MapPin size={14} /> {match.league}</span>
          <span>{match.country}</span>
        </div>

        <div className="p-6 bg-[color-mix(in_srgb,var(--bg-surface-2)_30%,transparent)] flex items-center justify-around text-[var(--fg)]">
          <div className="flex flex-col items-center gap-2 flex-1">
            <TeamLogo src={match.homeLogo} alt={match.homeTeam} className="w-14 h-14" />
            <span className="font-bold text-center">{match.homeTeam}</span>
          </div>
          <div className="px-4 text-center">
            <div className="text-4xl font-black font-mono tracking-wider">
              {match.status === 'UPCOMING' ? <span className="text-[var(--fg-faint)] text-2xl">{match.time}</span> : <span>{match.scoreHome} - {match.scoreAway}</span>}
            </div>
            <span className={`text-xs font-bold uppercase mt-1 block ${match.status === 'LIVE' ? 'text-red-500 animate-pulse' : 'text-[var(--fg-subtle)]'}`}>
              {match.status === 'LIVE' ? 'مباشر الآن' : match.status === 'FINISHED' ? 'انتهت' : 'لم تبدأ'}
            </span>
          </div>
          <div className="flex flex-col items-center gap-2 flex-1">
            <TeamLogo src={match.awayLogo} alt={match.awayTeam} className="w-14 h-14" />
            <span className="font-bold text-center">{match.awayTeam}</span>
          </div>
        </div>

        <div className="border-b border-[var(--border-subtle)]">
          <MatchPrediction match={match} />
        </div>

        <AdSlot placement="MATCH_PAGE" page="match" />

        <div className="flex border-b border-[var(--border-subtle)]">
          <TabButton active={activeTab === 'STATS'} onClick={() => setActiveTab('STATS')} icon={BarChart2} label="إحصائيات" />
          <TabButton active={activeTab === 'LINEUPS'} onClick={() => setActiveTab('LINEUPS')} icon={Users} label="التشكيلة" />
          <TabButton active={activeTab === 'SUMMARY'} onClick={() => setActiveTab('SUMMARY')} icon={Share2} label="ملخص" />
        </div>

        <div className="p-6 min-h-[240px]">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          ) : !details ? (
            <div className="flex flex-col justify-center items-center h-48 text-[var(--fg-faint)]">
              <AlertCircle size={32} className="mb-2" />
              <p>تفاصيل المباراة غير متاحة حالياً.</p>
            </div>
          ) : activeTab === 'STATS' && stats ? (
            <div className="space-y-4 text-sm">
              <StatRow label="التسديدات" valueHome={stats.shotsHome} valueAway={stats.shotsAway} />
              <StatRow label="تسديدات على المرمى" valueHome={stats.shotsOnTargetHome} valueAway={stats.shotsOnTargetAway} />
              <StatRow label="الركنيات" valueHome={stats.cornersHome} valueAway={stats.cornersAway} />
              <div className="pt-4">
                <div className="w-full bg-[var(--bg-surface-2)] rounded-full h-2.5">
                  <div className="bg-primary h-2.5 rounded-l-full" style={{ width: `${stats.possession}%` }} />
                </div>
                <div className="flex justify-between items-center text-xs text-[var(--fg-faint)] mt-2 px-1">
                  <span className="font-mono font-bold text-[var(--fg-muted)]">{stats.possession}%</span>
                  <span className="font-bold">الاستحواذ</span>
                  <span className="font-mono font-bold text-[var(--fg-muted)]">{100 - stats.possession}%</span>
                </div>
              </div>
            </div>
          ) : activeTab === 'LINEUPS' ? (
            <MatchLineupPitch homeTeam={match.homeTeam} awayTeam={match.awayTeam} />
          ) : activeTab === 'SUMMARY' ? (
            <div>
              <p className="text-[var(--fg-subtle)] text-sm mb-4">{details.summary}</p>
              <ul className="space-y-3">
                {details.events.length > 0 ? (
                  details.events.map((e, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm p-2 bg-[color-mix(in_srgb,var(--bg-surface-2)_50%,transparent)] rounded-md">
                      <span className="font-mono text-[var(--fg-subtle)]">{e.time}</span>
                      <span className="font-bold text-[var(--fg)]">{e.player}</span>
                      <span className="text-[var(--fg-faint)]">({e.team === 'HOME' ? match.homeTeam : match.awayTeam})</span>
                    </li>
                  ))
                ) : (
                  <div className="text-center text-[var(--fg-faint)] py-10">لا توجد أحداث رئيسية مسجلة.</div>
                )}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof BarChart2; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
        active ? 'text-primary border-b-2 border-primary bg-[var(--bg-surface-2)]' : 'text-[var(--fg-subtle)] hover:bg-[color-mix(in_srgb,var(--bg-surface-2)_50%,transparent)]'
      }`}
    >
      <Icon size={16} /> {label}
    </button>
  );
}

function StatRow({ label, valueHome, valueAway }: { label: string; valueHome: number; valueAway: number }) {
  return (
    <div className="flex justify-between items-center">
      <span className="font-bold text-[var(--fg-muted)] w-8 text-center">{valueHome}</span>
      <span className="text-[var(--fg-subtle)] flex-1 text-center">{label}</span>
      <span className="font-bold text-[var(--fg-muted)] w-8 text-center">{valueAway}</span>
    </div>
  );
}
