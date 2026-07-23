'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  User, ArrowRight, TrendingUp, Award, Repeat, HeartPulse, IdCard, Newspaper, Briefcase,
} from 'lucide-react';
import TeamLogo from '@/components/TeamLogo';
import NewsCard from '@/components/NewsCard';
import { data } from '@/lib/data';
import type { Player, ClubProfile, Article } from '@/types';
import type { TransferRecord, InjuryRecord, AwardRecord } from '@/types/community';

type TabKey = 'OVERVIEW' | 'STATS' | 'CAREER' | 'NEWS';
type SyncState = 'IDLE' | 'SYNCING' | 'FAILED' | 'RATE_LIMITED';

export default function PlayerDetailPage() {
  const params = useParams<{ clubId: string; playerId: string }>();
  const [result, setResult] = useState<{ player: Player; club: ClubProfile } | null | undefined>(undefined);
  const [career, setCareer] = useState<{ transfers: TransferRecord[]; injuries: InjuryRecord[]; awards: AwardRecord[] } | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('OVERVIEW');
  const [syncState, setSyncState] = useState<SyncState>('IDLE');

  useEffect(() => {
    if (!params?.clubId || !params?.playerId) return;
    const { clubId, playerId } = params;
    setResult(undefined);
    setSyncState('IDLE');

    data.getPlayerById(clubId, playerId).then(async (found) => {
      if (found) {
        setResult(found);
        return;
      }

      // Not in our database yet. If the id came from a live match via
      // API-Football (namespaced "af-..."), auto-create the club/player
      // from the API the first time anyone opens this page, then load
      // the freshly-stored row like any other player.
      if (!playerId.startsWith('af-')) {
        setResult(null);
        return;
      }

      setSyncState('SYNCING');
      try {
        const res = await fetch('/api/sync/player', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clubId, playerId }),
        });
        if (res.status === 429) {
          setSyncState('RATE_LIMITED');
          setResult(null);
          return;
        }
        if (!res.ok) throw new Error('sync failed');
        const refreshed = await data.getPlayerById(clubId, playerId);
        setResult(refreshed);
        setSyncState('IDLE');
      } catch {
        setSyncState('FAILED');
        setResult(null);
      }
    });

    data.getPlayerCareerData(clubId, playerId).then(setCareer);
  }, [params, params?.clubId, params?.playerId]);

  useEffect(() => {
    if (!result) return;
    data.getArticles().then((articles) => {
      setRelatedArticles(articles.filter((a) => a.title.includes(result.player.name)));
    });
  }, [result]);

  if (syncState === 'SYNCING') {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--fg-faint)]">
        جارٍ إحضار بيانات اللاعب من API-Football...
      </div>
    );
  }

  if (result === undefined) {
    return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--fg-faint)]">جارٍ التحميل...</div>;
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--fg)]">
        <div className="text-center p-8 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)]">
          <h2 className="text-2xl font-bold mb-2">عذراً</h2>
          <p className="text-[var(--fg-subtle)]">
            {syncState === 'RATE_LIMITED'
              ? 'الموقع وصل الحد الأقصى المسموح من طلبات API-Football مؤقتًا — جرّب بعد دقيقة.'
              : syncState === 'FAILED'
              ? 'تعذّر جلب بيانات هذا اللاعب من API-Football حاليًا.'
              : 'بيانات هذا اللاعب غير متوفرة حالياً.'}
          </p>
          <Link href="/clubs" className="text-primary mt-4 inline-block font-bold hover:underline">العودة للأندية</Link>
        </div>
      </div>
    );
  }

  const { player, club } = result;
  const primaryColor = club.colors?.primary || '#10b981';

  const careerCount = (career?.transfers.length || 0) + (career?.injuries.length || 0) + (career?.awards.length || 0);

  const TABS: { key: TabKey; label: string; icon: typeof User; count?: number }[] = [
    { key: 'OVERVIEW', label: 'نظرة عامة', icon: IdCard },
    { key: 'STATS', label: 'الإحصائيات', icon: TrendingUp },
    { key: 'CAREER', label: 'المسيرة المهنية', icon: Briefcase, count: careerCount },
    { key: 'NEWS', label: 'أخبار متعلقة', icon: Newspaper, count: relatedArticles.length },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Link href={`/club/${club.id}`} className="flex items-center gap-1 text-[var(--fg-subtle)] hover:text-[var(--fg)] text-sm mb-6 w-fit">
        <ArrowRight size={16} /> العودة لصفحة {club.name}
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="flex flex-col items-center md:sticky md:top-24 md:self-start">
          <div
            className="relative w-full max-w-[260px] aspect-[2/3] rounded-t-3xl rounded-b-2xl overflow-hidden border shadow-2xl"
            style={{ borderColor: primaryColor, background: `linear-gradient(160deg, ${primaryColor}33, #0f172a 60%)` }}
          >
            <div className="absolute top-6 right-5 flex flex-col items-center gap-1 z-20">
              <span className="text-4xl font-black leading-none text-[var(--fg)]">{player.rating}</span>
              <span className="text-xs font-bold uppercase tracking-wider text-white/80">{player.position}</span>
              <div className="w-8 h-8 mt-2">
                <TeamLogo src={club.logo} alt={club.name} className="w-8 h-8" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-4/5">
              {player.image ? (
                <Image src={player.image} alt={player.name} fill sizes="260px" className="object-contain drop-shadow-2xl" />
              ) : (
                <div className="w-full h-full flex items-end justify-center">
                  <User size={160} className="text-white/20" />
                </div>
              )}
            </div>
          </div>
          <h1 className="text-2xl font-black text-[var(--fg)] mt-4 text-center">{player.name}</h1>
          {player.englishName && <p className="text-[var(--fg-faint)] text-xs">{player.englishName}</p>}
          <p className="text-[var(--fg-subtle)] text-sm">#{player.number} • {club.name}{player.age ? ` • ${player.age} سنة` : ''}</p>

          {player.marketValue !== undefined && (
            <div className="w-full max-w-[260px] mt-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-3 flex items-center justify-between">
              <span className="text-[var(--fg-faint)] text-xs font-bold">القيمة السوقية</span>
              <span className="text-lg font-black text-emerald-400">€{player.marketValue.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          {/* Horizontal tab bar */}
          <div className="sticky top-16 z-30 -mx-4 px-4 md:mx-0 md:px-0 bg-[var(--bg-base)]/95 backdrop-blur border-b border-[var(--border-subtle)] mb-6">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-bold transition-colors border-b-2 ${
                      active
                        ? 'text-primary border-primary'
                        : 'text-[var(--fg-subtle)] border-transparent hover:text-[var(--fg)]'
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                    {typeof tab.count === 'number' && tab.count > 0 && (
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${active ? 'bg-primary/15 text-primary' : 'bg-[var(--bg-surface-2)] text-[var(--fg-faint)]'}`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            {activeTab === 'OVERVIEW' && (
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6">
                <h3 className="font-bold text-[var(--fg)] mb-4 text-lg border-b border-[var(--border-subtle)] pb-2">البيانات الشخصية</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  {player.birthDate && (
                    <div>
                      <span className="block text-[var(--fg-faint)] text-xs mb-1">تاريخ الميلاد</span>
                      <span className="text-[var(--fg)] font-bold">{new Date(player.birthDate).toLocaleDateString('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                  )}
                  {player.birthPlace && (
                    <div>
                      <span className="block text-[var(--fg-faint)] text-xs mb-1">مكان الميلاد</span>
                      <span className="text-[var(--fg)] font-bold">{player.birthPlace}</span>
                    </div>
                  )}
                  {player.heightCm && (
                    <div>
                      <span className="block text-[var(--fg-faint)] text-xs mb-1">الطول</span>
                      <span className="text-[var(--fg)] font-bold">{player.heightCm} سم</span>
                    </div>
                  )}
                  {player.weightKg && (
                    <div>
                      <span className="block text-[var(--fg-faint)] text-xs mb-1">الوزن</span>
                      <span className="text-[var(--fg)] font-bold">{player.weightKg} كجم</span>
                    </div>
                  )}
                  {player.preferredFoot && (
                    <div>
                      <span className="block text-[var(--fg-faint)] text-xs mb-1">القدم المفضلة</span>
                      <span className="text-[var(--fg)] font-bold">{player.preferredFoot === 'RIGHT' ? 'اليمنى' : player.preferredFoot === 'LEFT' ? 'اليسرى' : 'كلتاهما'}</span>
                    </div>
                  )}
                  {player.nationality && (
                    <div>
                      <span className="block text-[var(--fg-faint)] text-xs mb-1">الجنسية</span>
                      <span className="text-[var(--fg)] font-bold">{player.nationality}</span>
                    </div>
                  )}
                </div>
                {!player.birthDate && !player.birthPlace && !player.heightCm && !player.weightKg && !player.preferredFoot && !player.nationality && (
                  <p className="text-[var(--fg-faint)] text-sm text-center py-2">لا تتوفر بيانات شخصية إضافية حاليًا.</p>
                )}
              </div>
            )}

            {activeTab === 'STATS' && (
              <>
                <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6">
                  <h3 className="font-bold text-[var(--fg)] mb-4 text-lg border-b border-[var(--border-subtle)] pb-2 flex items-center gap-2">
                    <TrendingUp size={18} className="text-primary" /> الإحصائيات الفنية
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                    {(['pac', 'sho', 'pas', 'dri', 'def', 'phy'] as const).map((key) => (
                      <div key={key} className="text-center">
                        <span className="block text-2xl font-black text-[var(--fg)]">{player.stats?.[key] ?? '-'}</span>
                        <span className="text-[10px] text-[var(--fg-faint)] font-bold uppercase tracking-widest">{key}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {player.seasonStats && (
                  <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6">
                    <h3 className="font-bold text-[var(--fg)] mb-4 text-lg border-b border-[var(--border-subtle)] pb-2">أداء الموسم الحالي</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <Stat label="المباريات" value={player.seasonStats.matches} />
                      <Stat label="الأهداف" value={player.seasonStats.goals} />
                      <Stat label="التمريرات الحاسمة" value={player.seasonStats.assists} />
                      <Stat label="متوسط التقييم" value={player.seasonStats.rating} />
                      {player.seasonStats.minutes !== undefined && <Stat label="دقائق اللعب" value={player.seasonStats.minutes} />}
                      {player.seasonStats.yellowCards !== undefined && <Stat label="بطاقات صفراء" value={player.seasonStats.yellowCards} />}
                      {player.seasonStats.redCards !== undefined && <Stat label="بطاقات حمراء" value={player.seasonStats.redCards} />}
                      {player.seasonStats.shots !== undefined && <Stat label="التسديدات" value={player.seasonStats.shots} />}
                      {player.seasonStats.shotsOnTarget !== undefined && <Stat label="على المرمى" value={player.seasonStats.shotsOnTarget} />}
                      {player.seasonStats.passAccuracy !== undefined && <Stat label="دقة التمرير %" value={player.seasonStats.passAccuracy} />}
                      {player.seasonStats.cleanSheets !== undefined && <Stat label="نظافة الشباك" value={player.seasonStats.cleanSheets} />}
                      {player.seasonStats.saves !== undefined && <Stat label="التصديات" value={player.seasonStats.saves} />}
                      {player.seasonStats.tackles !== undefined && <Stat label="الالتقاطات" value={player.seasonStats.tackles} />}
                    </div>
                  </div>
                )}

                {!player.seasonStats && (
                  <p className="text-[var(--fg-faint)] text-sm text-center py-4">لا تتوفر إحصائيات موسم حالية لهذا اللاعب.</p>
                )}
              </>
            )}

            {activeTab === 'CAREER' && (
              <div className="grid grid-cols-1 gap-4">
                <CareerSection icon={Repeat} label="سجل الانتقالات" isEmpty={!career || career.transfers.length === 0}>
                  {career?.transfers.map((t, i) => (
                    <div key={i} className="flex items-center justify-between text-sm p-3 bg-[var(--bg-base)] rounded-lg">
                      <span className="text-[var(--fg-muted)]">{t.from} ← {t.to}</span>
                      <span className="text-[var(--fg-faint)] text-xs">{t.season} • {t.type === 'loan' ? 'إعارة' : t.type === 'free' ? 'انتقال حر' : 'انتقال نهائي'}</span>
                    </div>
                  ))}
                </CareerSection>

                <CareerSection icon={HeartPulse} label="الإصابات" isEmpty={!career || career.injuries.length === 0}>
                  {career?.injuries.map((inj, i) => (
                    <div key={i} className="flex items-center justify-between text-sm p-3 bg-[var(--bg-base)] rounded-lg">
                      <span className="text-[var(--fg-muted)]">{inj.type}</span>
                      <span className={`text-xs font-bold ${inj.status === 'active' ? 'text-red-400' : 'text-emerald-400'}`}>
                        {inj.status === 'active' ? 'مستمرة' : 'تعافى'}
                      </span>
                    </div>
                  ))}
                </CareerSection>

                <CareerSection icon={Award} label="الجوائز" isEmpty={!career || career.awards.length === 0}>
                  {career?.awards.map((a, i) => (
                    <div key={i} className="flex items-center justify-between text-sm p-3 bg-[var(--bg-base)] rounded-lg">
                      <span className="text-[var(--fg-muted)]">{a.title}</span>
                      <span className="text-[var(--fg-faint)] text-xs">{a.season}</span>
                    </div>
                  ))}
                </CareerSection>
              </div>
            )}

            {activeTab === 'NEWS' && (
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6">
                <h3 className="font-bold text-[var(--fg)] mb-4 text-lg border-b border-[var(--border-subtle)] pb-2">أخبار متعلقة</h3>
                {relatedArticles.length === 0 ? (
                  <p className="text-[var(--fg-faint)] text-sm text-center py-6">لا توجد أخبار متعلقة بهذا اللاعب حاليًا.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {relatedArticles.map((article) => (
                      <NewsCard key={article.id} article={article} compact />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-[var(--bg-base)] rounded-xl border border-[var(--border-subtle)] p-3 text-center">
      <span className="block text-xl font-black text-[var(--fg)]">{value}</span>
      <span className="text-[10px] text-[var(--fg-faint)] font-bold">{label}</span>
    </div>
  );
}

function CareerSection({
  icon: Icon,
  label,
  isEmpty,
  children,
}: {
  icon: typeof Repeat;
  label: string;
  isEmpty: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6">
      <h3 className="font-bold text-[var(--fg)] mb-4 text-lg border-b border-[var(--border-subtle)] pb-2 flex items-center gap-2">
        <Icon size={18} className="text-primary" /> {label}
      </h3>
      {isEmpty ? (
        <p className="text-[var(--fg-faint)] text-sm text-center py-4">لا توجد بيانات مسجلة حاليًا — تحتاج ربط مزود بيانات حي (مثل API-Football).</p>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </div>
  );
}
