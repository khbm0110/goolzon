'use client';

import { useState } from 'react';
import type { Standing } from '@/types';
import TeamLogo from './TeamLogo';

interface StandingsWidgetProps {
  standings: Standing[];
}

const TABS = [
  { key: 'SAUDI', label: 'السعودي' },
  { key: 'ENGLAND', label: 'الإنجليزي' },
  { key: 'SPAIN', label: 'الإسباني' },
  { key: 'ITALY', label: 'الإيطالي' },
  { key: 'GERMANY', label: 'الألماني' },
];

export default function StandingsWidget({ standings }: StandingsWidgetProps) {
  const [activeTab, setActiveTab] = useState<string>('SAUDI');

  const filtered = standings.filter((s) => s.league === activeTab).sort((a, b) => a.rank - b.rank);

  return (
    <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] overflow-hidden shadow-xl">
      <div className="bg-[var(--bg-surface-2)] px-4 py-3 border-b border-[var(--border)] flex justify-between items-center">
        <h3 className="font-bold text-[var(--fg)] text-sm">ترتيب الدوري</h3>
      </div>

      <div className="flex border-b border-[var(--border-subtle)] overflow-x-auto no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 text-xs font-bold whitespace-nowrap px-3 transition-colors ${
              activeTab === tab.key ? 'text-[var(--fg)] bg-[var(--bg-surface-2)] border-b-2 border-primary' : 'text-[var(--fg-subtle)] hover:text-[var(--fg-muted)] hover:bg-[color-mix(in_srgb,var(--bg-surface-2)_50%,transparent)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[200px]">
        {filtered.length > 0 ? (
          <table className="w-full text-xs">
            <thead className="text-[var(--fg-faint)] bg-[color-mix(in_srgb,var(--bg-base)_50%,transparent)] border-b border-[var(--border-subtle)]">
              <tr>
                <th className="py-2 px-2 w-8 text-center">#</th>
                <th className="py-2 px-2 text-right">الفريق</th>
                <th className="py-2 px-2 w-8 text-center">لعب</th>
                <th className="py-2 px-2 w-8 text-center font-bold text-[var(--fg)]">ن</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filtered.map((team) => (
                <tr key={team.team} className="hover:bg-[color-mix(in_srgb,var(--bg-surface-2)_30%,transparent)] transition-colors group">
                  <td className={`py-2 px-2 text-center font-bold ${team.rank <= 4 ? 'text-primary' : 'text-[var(--fg-faint)]'}`}>{team.rank}</td>
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-2">
                      <TeamLogo src={team.logo} alt={team.team} className="w-5 h-5" />
                      <span className="text-[var(--fg-muted)] font-medium group-hover:text-[var(--fg)] transition-colors">{team.team}</span>
                    </div>
                  </td>
                  <td className="py-2 px-2 text-center text-[var(--fg-faint)]">{team.played}</td>
                  <td className="py-2 px-2 text-center font-bold text-[var(--fg)]">{team.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-[var(--fg-faint)]">
            <p>لا توجد بيانات حالياً</p>
          </div>
        )}
      </div>
      <div className="p-2 text-center bg-[color-mix(in_srgb,var(--bg-surface-2)_50%,transparent)] border-t border-[var(--border-subtle)]">
        <a href="/standings" className="text-[10px] text-primary font-bold block w-full hover:text-[var(--fg)] transition-colors">
          جدول الترتيب الكامل
        </a>
      </div>
    </div>
  );
}
