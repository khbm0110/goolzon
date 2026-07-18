'use client';

import { useEffect, useState } from 'react';
import { ListOrdered } from 'lucide-react';
import { data } from '@/lib/data';
import TeamLogo from '@/components/TeamLogo';
import type { Standing } from '@/types';

const TABS = [
  { key: 'SAUDI', label: 'الدوري السعودي' },
  { key: 'ENGLAND', label: 'الدوري الإنجليزي' },
  { key: 'SPAIN', label: 'الدوري الإسباني' },
  { key: 'ITALY', label: 'الدوري الإيطالي' },
  { key: 'GERMANY', label: 'الدوري الألماني' },
];

export default function StandingsPage() {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [activeTab, setActiveTab] = useState('SAUDI');

  useEffect(() => {
    data.getStandings().then(setStandings);
  }, []);

  const filtered = standings.filter((s) => s.league === activeTab).sort((a, b) => a.rank - b.rank);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-black text-[var(--fg)] mb-8 flex items-center border-r-4 border-primary pr-4">
        <ListOrdered className="ml-3 text-primary" size={32} />
        جدول الترتيب الكامل
      </h1>

      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
              activeTab === tab.key ? 'bg-primary text-slate-900' : 'bg-[var(--bg-surface)] text-[var(--fg-subtle)] hover:text-[var(--fg)] border border-[var(--border-subtle)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden">
        {filtered.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="text-[var(--fg-faint)] bg-[color-mix(in_srgb,var(--bg-base)_50%,transparent)] border-b border-[var(--border-subtle)]">
              <tr>
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-3 text-right">الفريق</th>
                <th className="py-3 px-3 w-14 text-center">لعب</th>
                <th className="py-3 px-3 w-14 text-center">فوز</th>
                <th className="py-3 px-3 w-14 text-center">تعادل</th>
                <th className="py-3 px-3 w-14 text-center">خسارة</th>
                <th className="py-3 px-3 w-16 text-center font-bold text-[var(--fg)]">نقاط</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filtered.map((team) => (
                <tr key={team.team} className="hover:bg-[color-mix(in_srgb,var(--bg-surface-2)_30%,transparent)] transition-colors group">
                  <td className={`py-3 px-3 text-center font-bold ${team.rank <= 4 ? 'text-primary' : 'text-[var(--fg-faint)]'}`}>{team.rank}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <TeamLogo src={team.logo} alt={team.team} className="w-6 h-6" />
                      <span className="text-[var(--fg-muted)] font-medium group-hover:text-[var(--fg)] transition-colors">{team.team}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center text-[var(--fg-faint)]">{team.played}</td>
                  <td className="py-3 px-3 text-center text-[var(--fg-faint)]">{team.won}</td>
                  <td className="py-3 px-3 text-center text-[var(--fg-faint)]">{team.drawn}</td>
                  <td className="py-3 px-3 text-center text-[var(--fg-faint)]">{team.lost}</td>
                  <td className="py-3 px-3 text-center font-bold text-[var(--fg)]">{team.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-[var(--fg-faint)]">لا توجد بيانات لهذا الدوري حالياً</div>
        )}
      </div>
    </div>
  );
}
