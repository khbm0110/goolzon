'use client';

import { useEffect, useState } from 'react';
import { GitCompareArrows } from 'lucide-react';
import TeamLogo from '@/components/TeamLogo';
import { data } from '@/lib/data';
import type { ClubProfile, Standing } from '@/types';

export default function ComparePage() {
  const [clubs, setClubs] = useState<ClubProfile[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [clubAId, setClubAId] = useState('');
  const [clubBId, setClubBId] = useState('');

  useEffect(() => {
    data.getClubs().then((c) => {
      setClubs(c);
      if (c.length >= 2) {
        setClubAId(c[0].id);
        setClubBId(c[1].id);
      }
    });
    data.getStandings().then(setStandings);
  }, []);

  const clubA = clubs.find((c) => c.id === clubAId);
  const clubB = clubs.find((c) => c.id === clubBId);
  const standingA = standings.find((s) => s.team === clubA?.name);
  const standingB = standings.find((s) => s.team === clubB?.name);

  const avgRatingOf = (club?: ClubProfile) =>
    club?.squad?.length ? Math.round(club.squad.reduce((sum, p) => sum + p.rating, 0) / club.squad.length) : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-black text-[var(--fg)] mb-8 flex items-center border-r-4 border-primary pr-4">
        <GitCompareArrows className="ml-3 text-primary" size={32} />
        مقارنة الفرق
      </h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <select value={clubAId} onChange={(e) => setClubAId(e.target.value)} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)]">
          {clubs.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select value={clubBId} onChange={(e) => setClubBId(e.target.value)} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)]">
          {clubs.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {clubA && clubB && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden">
          <div className="grid grid-cols-2 border-b border-[var(--border-subtle)]">
            <div className="p-6 flex flex-col items-center border-l border-[var(--border-subtle)]">
              <TeamLogo src={clubA.logo} alt={clubA.name} className="w-16 h-16 mb-2" />
              <span className="font-bold text-[var(--fg)]">{clubA.name}</span>
            </div>
            <div className="p-6 flex flex-col items-center">
              <TeamLogo src={clubB.logo} alt={clubB.name} className="w-16 h-16 mb-2" />
              <span className="font-bold text-[var(--fg)]">{clubB.name}</span>
            </div>
          </div>

          <CompareRow label="المركز الحالي" valueA={standingA ? `#${standingA.rank}` : '-'} valueB={standingB ? `#${standingB.rank}` : '-'} />
          <CompareRow label="النقاط" valueA={standingA?.points ?? '-'} valueB={standingB?.points ?? '-'} />
          <CompareRow label="سنة التأسيس" valueA={clubA.founded} valueB={clubB.founded} />
          <CompareRow label="عدد المشجعين" valueA={clubA.fanCount?.toLocaleString() ?? '-'} valueB={clubB.fanCount?.toLocaleString() ?? '-'} />
          <CompareRow label="متوسط تقييم التشكيلة" valueA={avgRatingOf(clubA) || '-'} valueB={avgRatingOf(clubB) || '-'} />
          <CompareRow label="إجمالي البطولات" valueA={clubA.trophies?.reduce((s, t) => s + t.count, 0) ?? 0} valueB={clubB.trophies?.reduce((s, t) => s + t.count, 0) ?? 0} />
        </div>
      )}
    </div>
  );
}

function CompareRow({ label, valueA, valueB }: { label: string; valueA: string | number; valueB: string | number }) {
  const numA = typeof valueA === 'number' ? valueA : parseFloat(String(valueA).replace(/[^\d.-]/g, ''));
  const numB = typeof valueB === 'number' ? valueB : parseFloat(String(valueB).replace(/[^\d.-]/g, ''));
  const aWins = !isNaN(numA) && !isNaN(numB) && numA > numB;
  const bWins = !isNaN(numA) && !isNaN(numB) && numB > numA;

  return (
    <div className="grid grid-cols-3 items-center border-b border-[var(--border-subtle)] last:border-0">
      <span className={`p-3 text-center font-bold ${aWins ? 'text-primary' : 'text-[var(--fg-muted)]'}`}>{valueA}</span>
      <span className="p-3 text-center text-xs text-[var(--fg-faint)]">{label}</span>
      <span className={`p-3 text-center font-bold ${bWins ? 'text-primary' : 'text-[var(--fg-muted)]'}`}>{valueB}</span>
    </div>
  );
}
