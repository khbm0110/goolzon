'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Filter, Search, RefreshCw, ChevronLeft } from 'lucide-react';
import type { Player } from '@/types';

type PositionGroup = 'ALL' | 'GK' | 'DEF' | 'MID' | 'FWD';

const POSITION_GROUPS: { key: PositionGroup; label: string }[] = [
  { key: 'ALL', label: 'كل المراكز' },
  { key: 'GK', label: 'حارس مرمى' },
  { key: 'DEF', label: 'دفاع' },
  { key: 'MID', label: 'وسط' },
  { key: 'FWD', label: 'هجوم' },
];

function positionGroupOf(position: Player['position']): PositionGroup {
  if (position === 'GK') return 'GK';
  if (['DEF', 'CB', 'LB', 'RB'].includes(position)) return 'DEF';
  if (['MID', 'CM', 'CDM', 'CAM', 'RM', 'LM'].includes(position)) return 'MID';
  return 'FWD';
}

function positionLabel(position: Player['position']): string {
  const map: Record<string, string> = {
    GK: 'حارس مرمى',
    DEF: 'مدافع',
    CB: 'قلب دفاع',
    LB: 'ظهير أيسر',
    RB: 'ظهير أيمن',
    MID: 'وسط',
    CM: 'وسط',
    CDM: 'وسط دفاعي',
    CAM: 'وسط هجومي',
    RM: 'وسط أيمن',
    LM: 'وسط أيسر',
    FWD: 'مهاجم',
    ST: 'مهاجم',
    RW: 'جناح أيمن',
    LW: 'جناح أيسر',
  };
  return map[position] || position;
}

function formatValue(value?: number) {
  if (!value) return '-';
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(0)}M`;
  return `€${(value / 1000).toFixed(0)}K`;
}

export default function SquadSection({ clubId, squad }: { clubId: string; squad: Player[] }) {
  const [activeFilter, setActiveFilter] = useState<PositionGroup>('ALL');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    return squad
      .filter((p) => activeFilter === 'ALL' || positionGroupOf(p.position) === activeFilter)
      .filter((p) => !query.trim() || p.name.includes(query) || p.englishName?.toLowerCase().includes(query.toLowerCase()));
  }, [squad, activeFilter, query]);

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-[var(--fg)]">قائمة اللاعبين</h2>
          <span className="text-xs font-bold text-[var(--fg-subtle)] bg-[var(--bg-surface-2)] px-3 py-1 rounded-full">{squad.length} لاعب</span>
        </div>

        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            <Filter size={16} className="text-[var(--fg-faint)] flex-shrink-0" />
            {POSITION_GROUPS.map((g) => (
              <button
                key={g.key}
                onClick={() => setActiveFilter(g.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                  activeFilter === g.key ? 'bg-primary text-white' : 'bg-[var(--bg-surface-2)] text-[var(--fg-subtle)] hover:text-[var(--fg)]'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          <div className="relative md:w-64 md:mr-auto">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-faint)]" />
            <input
              type="text"
              placeholder="ابحث عن لاعب..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] rounded-lg pr-9 pl-3 py-2 text-sm text-[var(--fg)] placeholder:text-[var(--fg-faint)] focus:border-primary outline-none"
            />
          </div>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] text-[var(--fg-faint)] text-xs">
              <th className="p-3 text-right font-bold">اللاعب</th>
              <th className="p-3 text-center font-bold">الرقم</th>
              <th className="p-3 text-center font-bold">المركز</th>
              <th className="p-3 text-center font-bold">العمر</th>
              <th className="p-3 text-center font-bold">الجنسية</th>
              <th className="p-3 text-center font-bold" colSpan={3}>إحصائيات الموسم</th>
              <th className="p-3 text-center font-bold">القيمة السوقية</th>
            </tr>
            <tr className="border-b border-[var(--border-subtle)] text-[var(--fg-faint)] text-[10px]">
              <th colSpan={5}></th>
              <th className="pb-2 text-center font-bold">المباريات</th>
              <th className="pb-2 text-center font-bold">الأهداف</th>
              <th className="pb-2 text-center font-bold">صناعة</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {filtered.map((player) => (
              <tr key={player.id} className="hover:bg-[var(--bg-surface-2)] transition-colors group">
                <td className="p-3">
                  <Link href={`/player/${clubId}/${player.id}`} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--bg-surface-2)] overflow-hidden flex-shrink-0 border border-[var(--border-subtle)]">
                      {player.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={player.image} alt={player.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-[var(--fg)] group-hover:text-primary transition-colors truncate">{player.name}</p>
                      {player.englishName && <p className="text-xs text-[var(--fg-faint)] truncate">{player.englishName}</p>}
                    </div>
                  </Link>
                </td>
                <td className="p-3 text-center font-mono text-[var(--fg-muted)]">{player.number}</td>
                <td className="p-3 text-center">
                  <span className="text-xs font-bold px-2 py-1 rounded bg-[var(--bg-surface-2)] text-[var(--fg-muted)]">{positionLabel(player.position)}</span>
                </td>
                <td className="p-3 text-center text-[var(--fg-muted)]">{player.age ?? '-'}</td>
                <td className="p-3 text-center">
                  {player.nationality && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={player.nationality} alt="" className="w-5 h-3.5 object-cover rounded-sm inline-block" />
                  )}
                </td>
                <td className="p-3 text-center text-[var(--fg-muted)]">{player.seasonStats?.matches ?? '-'}</td>
                <td className="p-3 text-center font-bold text-[var(--fg)]">{player.seasonStats?.goals ?? '-'}</td>
                <td className="p-3 text-center text-[var(--fg-muted)]">{player.seasonStats?.assists ?? '-'}</td>
                <td className="p-3 text-center font-bold text-primary whitespace-nowrap">{formatValue(player.marketValue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden divide-y divide-[var(--border-subtle)]">
        {filtered.map((player) => (
          <Link key={player.id} href={`/player/${clubId}/${player.id}`} className="flex items-center gap-3 p-4">
            <div className="w-12 h-12 rounded-full bg-[var(--bg-surface-2)] overflow-hidden flex-shrink-0 border border-[var(--border-subtle)]">
              {player.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={player.image} alt={player.name} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[var(--fg)] truncate">{player.name}</p>
              {player.englishName && <p className="text-xs text-[var(--fg-faint)] truncate mb-1">{player.englishName}</p>}
              <div className="flex items-center gap-2 text-xs text-[var(--fg-muted)]">
                {player.age && <span>{player.age} سنة</span>}
                {player.nationality && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={player.nationality} alt="" className="w-4 h-3 object-cover rounded-sm" />
                )}
                <span className="font-mono">#{player.number}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--bg-surface-2)]">{positionLabel(player.position)}</span>
              </div>
            </div>
            <div className="text-left flex-shrink-0">
              <span className="text-[10px] text-[var(--fg-faint)] block">القيمة السوقية</span>
              <span className="font-black text-primary">{formatValue(player.marketValue)}</span>
            </div>
            <ChevronLeft size={16} className="text-[var(--fg-faint)] flex-shrink-0" />
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-[var(--fg-faint)] text-sm">لا يوجد لاعبون مطابقون لبحثك.</div>
      )}

      <div className="p-3 flex items-center justify-center gap-1.5 text-[10px] text-[var(--fg-faint)] border-t border-[var(--border-subtle)] bg-[var(--bg-surface-2)]">
        <RefreshCw size={11} />
        آخر تحديث: {new Date().toLocaleDateString('ar-SA')}
      </div>
    </div>
  );
}
