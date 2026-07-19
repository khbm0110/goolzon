'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Shield, Search, Check, Plus, Users, ArrowRight, Target, GitCompareArrows, Sparkles, Star } from 'lucide-react';
import TeamLogo from '@/components/TeamLogo';
import { useAuth } from '@/contexts/AuthContext';
import { data } from '@/lib/data';
import type { ClubProfile } from '@/types';

export default function ClubsPage() {
  const { followedTeams, toggleFollow } = useAuth();
  const [clubs, setClubs] = useState<ClubProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    data.getClubs().then(setClubs);
  }, []);

  const filteredClubs = useMemo(() => {
    return clubs.filter(
      (club) =>
        club.name.includes(searchQuery) ||
        club.englishName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        club.country?.includes(searchQuery)
    );
  }, [clubs, searchQuery]);

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4 border-b border-[var(--border-subtle)] pb-6">
        <div>
          <h1 className="text-3xl font-black text-[var(--fg)] flex items-center gap-3">
            <Shield className="text-primary" size={32} />
            أندية goolzon
          </h1>
          <p className="text-[var(--fg-subtle)] mt-2 text-sm">ابحث عن ناديك المفضل وتابعه للحصول على آخر أخباره في صفحتك الشخصية.</p>
          <div className="flex gap-3 mt-3 flex-wrap">
            <Link href="/topscorers" className="flex items-center gap-1 text-xs font-bold text-primary hover:text-emerald-400">
              <Target size={14} /> الهدافون
            </Link>
            <Link href="/assists" className="flex items-center gap-1 text-xs font-bold text-primary hover:text-emerald-400">
              <Sparkles size={14} /> صناع الأهداف
            </Link>
            <Link href="/best-players" className="flex items-center gap-1 text-xs font-bold text-primary hover:text-emerald-400">
              <Star size={14} /> أفضل اللاعبين
            </Link>
            <Link href="/compare" className="flex items-center gap-1 text-xs font-bold text-primary hover:text-emerald-400">
              <GitCompareArrows size={14} /> مقارنة الفرق
            </Link>
          </div>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute right-3 top-3.5 text-[var(--fg-faint)]" size={18} />
          <input
            type="text"
            placeholder="ابحث عن نادٍ (الهلال، النصر، ريال مدريد...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-3 pr-10 text-[var(--fg)] focus:border-primary outline-none transition-colors shadow-sm"
          />
        </div>
      </div>

      {filteredClubs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredClubs.map((club) => {
            const isFollowing = followedTeams.includes(club.name);
            return (
              <div key={club.id} className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden group hover:border-[var(--border)] transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
                <div className="relative h-24 bg-[var(--bg-base)]">
                  <div className="absolute inset-0 opacity-50">
                    {club.coverImage && (
                      <Image src={club.coverImage} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" alt="cover" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                  </div>
                  <div className="absolute -bottom-8 right-4 w-16 h-16 bg-[var(--bg-surface-2)] rounded-xl p-1 border-4 border-slate-900 shadow-lg flex items-center justify-center">
                    <TeamLogo src={club.logo} alt={club.name} className="w-12 h-12" />
                  </div>
                </div>

                <div className="pt-10 px-5 pb-5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-[var(--fg)] group-hover:text-primary transition-colors">{club.name}</h3>
                      <span className="text-[10px] text-[var(--fg-faint)] bg-[var(--bg-base)] px-2 py-0.5 rounded border border-[var(--border-subtle)] inline-block mt-1">{club.country}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-[var(--fg-subtle)] mb-6 border-t border-[var(--border-subtle)] pt-3 mt-3">
                    <div className="flex items-center gap-1">
                      <Users size={12} />
                      <span>{club.fanCount?.toLocaleString()} مشجع</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleFollow(club.name)}
                      className={`flex-1 py-2 px-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                        isFollowing ? 'bg-[var(--bg-surface-2)] text-[var(--fg)] hover:bg-red-500/10 hover:text-red-500' : 'bg-primary text-slate-900 hover:bg-emerald-400'
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <Check size={16} /> متابع
                        </>
                      ) : (
                        <>
                          <Plus size={16} /> متابعة
                        </>
                      )}
                    </button>
                    <Link href={`/club/${club.id}`} className="p-2 bg-[var(--bg-surface-2)] text-[var(--fg-subtle)] rounded-lg hover:text-[var(--fg)] hover:bg-[var(--bg-surface-3)] transition-colors" title="زيارة الصفحة">
                      <ArrowRight size={20} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-[color-mix(in_srgb,var(--bg-surface)_50%,transparent)] rounded-2xl border border-[var(--border-subtle)] border-dashed">
          <Search size={48} className="text-slate-700 mb-4" />
          <h3 className="text-xl font-bold text-[var(--fg-muted)] mb-2">لم يتم العثور على أندية</h3>
          <p className="text-[var(--fg-faint)] text-sm">جرب البحث باسم آخر أو تحقق من الكتابة.</p>
        </div>
      )}
    </div>
  );
}
