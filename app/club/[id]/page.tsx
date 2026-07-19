'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Users, MapPin, Trophy, User, Activity, Check, Info } from 'lucide-react';
import TeamLogo from '@/components/TeamLogo';
import NewsCard from '@/components/NewsCard';
import SquadSection from '@/components/SquadSection';
import ClubMatchesSection from '@/components/ClubMatchesSection';
import { useAuth } from '@/contexts/AuthContext';
import { data } from '@/lib/data';
import type { ClubProfile, Standing, Article, Match } from '@/types';

export default function ClubDashboardPage() {
  const params = useParams<{ id: string }>();
  const { toggleFollow, followedTeams } = useAuth();
  const [activeTab, setActiveTab] = useState<'HOME' | 'SQUAD' | 'MATCHES' | 'TROPHIES' | 'HISTORY'>('HOME');
  const [club, setClub] = useState<ClubProfile | null | undefined>(undefined);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [simulatedFanCount, setSimulatedFanCount] = useState(0);

  const clubId = params?.id?.toLowerCase();

  useEffect(() => {
    if (!clubId) return;
    data.getClubById(clubId).then(setClub);
    data.getStandings().then(setStandings);
    data.getArticles().then(setArticles);
    data.getMatches().then(setMatches);
  }, [clubId]);

  useEffect(() => {
    if (club) setSimulatedFanCount(club.fanCount || 50000);
  }, [club]);

  if (club === undefined) {
    return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--fg-faint)]">جارٍ التحميل...</div>;
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--fg)]">
        <div className="text-center p-8 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)]">
          <h2 className="text-2xl font-bold mb-2">عذراً</h2>
          <p className="text-[var(--fg-subtle)]">بيانات هذا النادي غير متوفرة حالياً.</p>
          <Link href="/" className="text-primary mt-4 inline-block font-bold hover:underline">العودة للرئيسية</Link>
        </div>
      </div>
    );
  }

  const isFollowing = followedTeams.includes(club.name);
  const currentStanding = standings.find((s) => s.team === club.name);
  const clubArticles = articles.filter((a) => a.title.includes(club.name));

  const handleFollow = () => {
    toggleFollow(club.name);
    setSimulatedFanCount((prev) => (isFollowing ? prev - 1 : prev + 1));
  };

  const primaryColor = club.colors?.primary || '#10b981';
  const secondaryColor = club.colors?.secondary || '#0f172a';
  const textColor = club.colors?.text || '#ffffff';

  return (
    <div className="bg-[var(--bg-base)] min-h-screen pb-12">
      <div className="relative h-[450px] md:h-[500px]">
        <div className="absolute inset-0">
          <Image
            src={club.coverImage || 'https://images.unsplash.com/photo-1522778119026-d647f0565c6a?auto=format&fit=crop&q=80&w=1200'}
            alt={club.name}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 opacity-90" style={{ background: `linear-gradient(to bottom, transparent 20%, ${secondaryColor} 90%, #020617 100%)` }} />
        </div>

        <div className="container mx-auto px-4 h-full flex flex-col justify-end pb-8 relative z-10 pointer-events-none">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 pointer-events-auto">
            <div className="relative group">
              <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-2xl p-1 shadow-2xl transform transition-transform group-hover:scale-105" style={{ boxShadow: `0 0 40px ${primaryColor}40` }}>
                <div className="w-full h-full rounded-xl overflow-hidden flex items-center justify-center bg-slate-50 relative">
                  <TeamLogo src={club.logo} alt={club.name} className="w-28 h-28 object-contain" />
                </div>
              </div>
              {isFollowing && (
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-[var(--fg)] p-1.5 rounded-full border-4 border-slate-950 shadow-lg">
                  <Check size={16} strokeWidth={4} />
                </div>
              )}
            </div>

            <div className="flex-1 text-center md:text-right text-[var(--fg)] pb-2">
              <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1 justify-center md:justify-start">
                <h1 className="text-4xl md:text-5xl font-black drop-shadow-lg">{club.name}</h1>
                <span className="bg-[color-mix(in_srgb,var(--bg-surface-2)_80%,transparent)] backdrop-blur border border-[var(--border-strong)] text-[var(--fg-muted)] text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 w-fit mx-auto md:mx-0">
                  <Info size={10} /> صفحة جماهيرية
                </span>
              </div>
              <p className="text-lg opacity-90 font-medium mb-3">{club.nickname} • تأسس {club.founded}</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-[var(--fg-muted)] font-bold">
                <span className="flex items-center gap-1"><MapPin size={14} style={{ color: primaryColor }} /> {club.stadium}</span>
                <span className="flex items-center gap-1"><User size={14} style={{ color: primaryColor }} /> {club.coach}</span>
                <span className="flex items-center gap-1"><Users size={14} style={{ color: primaryColor }} /> {simulatedFanCount.toLocaleString()} مشجع</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 min-w-[200px]">
              <button
                onClick={handleFollow}
                className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-black text-lg shadow-lg transition-all active:scale-95 hover:brightness-110"
                style={{ backgroundColor: isFollowing ? '#ffffff' : primaryColor, color: isFollowing ? '#0f172a' : textColor }}
              >
                {isFollowing ? (<><Check size={20} /> مُتابَع</>) : (<><Activity size={20} /> تابِع الفريق</>)}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6">
              <h3 className="font-bold text-[var(--fg)] mb-4 text-lg border-b border-[var(--border-subtle)] pb-2">عن النادي</h3>
              <ul className="space-y-4 text-sm text-[var(--fg-subtle)]">
                <li className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-2"><span>التأسيس</span><span className="text-[var(--fg)] font-mono">{club.founded}</span></li>
                <li className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-2"><span>الملعب</span><span className="text-[var(--fg)]">{club.stadium}</span></li>
                <li className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-2">
                  <span>المدرب</span>
                  <Link href={`/coach/${club.id}`} className="text-[var(--fg)] hover:text-primary transition-colors">{club.coach}</Link>
                </li>
              </ul>
            </div>

            {currentStanding && (
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 relative overflow-hidden">
                <h3 className="font-bold text-[var(--fg)] mb-6 text-lg border-b border-[var(--border-subtle)] pb-2 relative z-10">ترتيب الفريق</h3>
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <div className="text-center">
                    <span className="block text-3xl font-black text-[var(--fg)]" style={{ color: primaryColor }}>#{currentStanding.rank}</span>
                    <span className="text-[10px] text-[var(--fg-subtle)] font-bold">المركز</span>
                  </div>
                  <div className="w-px h-10 bg-[var(--bg-surface-2)]" />
                  <div className="text-center">
                    <span className="block text-2xl font-black text-[var(--fg)]">{currentStanding.points}</span>
                    <span className="text-[10px] text-[var(--fg-subtle)] font-bold">نقطة</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-9">
            <div className="flex border-b border-[var(--border-subtle)] mb-6 overflow-x-auto no-scrollbar">
              {(['HOME', 'SQUAD', 'MATCHES', 'TROPHIES', 'HISTORY'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="px-6 py-4 font-bold text-sm transition-all border-b-2 whitespace-nowrap"
                  style={{ color: activeTab === tab ? '#fff' : '#64748b', borderColor: activeTab === tab ? primaryColor : 'transparent' }}
                >
                  {tab === 'HOME' ? 'الرئيسية' : tab === 'SQUAD' ? 'قائمة اللاعبين' : tab === 'MATCHES' ? 'المباريات' : tab === 'TROPHIES' ? 'خزينة البطولات' : 'تاريخ النادي'}
                </button>
              ))}
            </div>

            <div className="min-h-[400px]">
              {activeTab === 'HOME' &&
                (clubArticles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {clubArticles.map((article) => (
                      <NewsCard key={article.id} article={article} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] border-dashed text-[var(--fg-faint)]">لا توجد أخبار حديثة.</div>
                ))}

              {activeTab === 'SQUAD' && <SquadSection clubId={club.id} squad={club.squad || []} />}

              {activeTab === 'MATCHES' && <ClubMatchesSection clubName={club.name} matches={matches} />}

              {activeTab === 'TROPHIES' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {club.trophies?.map((trophy, idx) => (
                    <div key={idx} className="bg-[var(--bg-surface)] p-6 rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border)] transition-all flex flex-col items-center justify-center text-center group">
                      <Trophy size={32} style={{ color: primaryColor }} className="mb-4 drop-shadow-lg" />
                      <h3 className="text-[var(--fg)] font-bold text-lg mb-2">{trophy.name}</h3>
                      <span className="text-3xl font-black text-slate-700 group-hover:text-[var(--fg)] transition-colors">{trophy.count}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'HISTORY' && (
                <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-8">
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[var(--border-subtle)]">
                    <div className="text-5xl font-black" style={{ color: primaryColor }}>{club.founded}</div>
                    <div>
                      <p className="text-[var(--fg)] font-bold">عام التأسيس</p>
                      <p className="text-[var(--fg-subtle)] text-sm">{club.name} — {club.nickname}</p>
                    </div>
                  </div>

                  {club.history && (
                    <div className="mb-8 pb-8 border-b border-[var(--border-subtle)]">
                      <p className="text-[var(--fg-muted)] leading-loose whitespace-pre-line">{club.history}</p>
                    </div>
                  )}

                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: primaryColor }} />
                      <div>
                        <p className="text-[var(--fg)] font-bold">{club.founded} — التأسيس</p>
                        <p className="text-[var(--fg-subtle)] text-sm">تأسس النادي وبدأ مسيرته في {club.country}.</p>
                      </div>
                    </div>
                    {club.trophies?.map((trophy, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: primaryColor }} />
                        <div>
                          <p className="text-[var(--fg)] font-bold">{trophy.count}× {trophy.name}</p>
                          <p className="text-[var(--fg-subtle)] text-sm">إجمالي ألقاب {trophy.name} عبر تاريخ النادي.</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-amber-500/80 border-t border-[var(--border-subtle)] mt-6 pt-4">
                    ⚠️ الخط الزمني بالأسفل مبني تلقائيًا من عدد البطولات. لإضافة محطات تاريخية أخرى، أضفها للنص أعلاه من لوحة الإدارة.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
