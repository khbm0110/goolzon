'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Shield, Plus, Edit, Trash2, LayoutGrid, FileText, Users, Settings, Check, Ban,
  MessageCircle, Clock, ShoppingBag, Globe, Megaphone, BarChart2, Bot, Save, LogOut,
  Home, Power, Trophy, Search, X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { data } from '@/lib/data';
import ArticleEditor from '@/components/admin/ArticleEditor';
import ClubEditor from '@/components/admin/ClubEditor';
import AdSlotEditor from '@/components/admin/AdSlotEditor';
import { Category, AD_PLACEMENT_LABELS, type Article, type User, type Comment, type ClubProfile, type Sponsor, type SeoSettings, type FeatureFlags, type AdSlot, type AdsGlobalSettings } from '@/types';

type AdminTab = 'OVERVIEW' | 'ARTICLES' | 'USERS' | 'MODERATION' | 'CLUBS' | 'SPONSORS' | 'SEO' | 'ADS' | 'LEAGUES' | 'ANALYTICS' | 'AUTOPILOT' | 'SETTINGS';

const COMING_SOON_TABS: { key: AdminTab; label: string; icon: typeof ShoppingBag; note: string }[] = [
  { key: 'ANALYTICS', label: 'التحليلات', icon: BarChart2, note: 'يحتاج ربط Google Analytics أولاً' },
];

export default function AdminDashboardPage() {
  const { currentUser, isAdmin, loading, signOut } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  const [articles, setArticles] = useState<Article[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [clubs, setClubs] = useState<ClubProfile[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [seoSettings, setSeoSettings] = useState<SeoSettings | null>(null);
  const [featureFlags, setFeatureFlagsState] = useState<FeatureFlags | null>(null);
  const [adSlots, setAdSlots] = useState<AdSlot[]>([]);
  const [adsGlobal, setAdsGlobal] = useState<AdsGlobalSettings | null>(null);
  const [trackedLeagues, setTrackedLeagues] = useState<any[]>([]);
  const [leagueQuery, setLeagueQuery] = useState('');
  const [leagueResults, setLeagueResults] = useState<any[]>([]);
  const [leagueSearching, setLeagueSearching] = useState(false);
  const [leagueSearchError, setLeagueSearchError] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [idSearchType, setIdSearchType] = useState<'team' | 'player'>('team');
  const [idSearchQuery, setIdSearchQuery] = useState('');
  const [idSearchResults, setIdSearchResults] = useState<any[]>([]);
  const [idSearching, setIdSearching] = useState(false);
  const [idSearchError, setIdSearchError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [autopilotSettings, setAutopilotSettings] = useState<any>(null);
  const [autopilotProviders, setAutopilotProviders] = useState<any[]>([]);
  const [pendingArticles, setPendingArticles] = useState<any[]>([]);
  const [newRssName, setNewRssName] = useState('');
  const [newRssUrl, setNewRssUrl] = useState('');
  const [autopilotBusy, setAutopilotBusy] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Partial<Article> | null>(null);
  const [editorMode, setEditorMode] = useState<'NEW' | 'EDIT'>('NEW');
  const [editingClub, setEditingClub] = useState<ClubProfile | null>(null);
  const [editingAdSlot, setEditingAdSlot] = useState<AdSlot | null>(null);

  useEffect(() => {
    if (!loading && !isAdmin) router.replace('/');
  }, [isAdmin, loading, router]);

  async function refreshAll() {
    const [a, u, c, cl, sp, seo, ff, ads, adsG] = await Promise.all([
      data.getArticles(),
      data.getUsers(),
      data.getAllComments(),
      data.getClubs(),
      data.getSponsors(),
      data.getSeoSettings(),
      data.getFeatureFlags(),
      data.getAdSlots(),
      data.getAdsGlobalSettings(),
    ]);
    setArticles(a);
    setUsers(u);
    setComments(c);
    setClubs(cl);
    setSponsors(sp);
    setSeoSettings(seo);
    setFeatureFlagsState(ff);
    setAdSlots(ads);
    setAdsGlobal(adsG);
  }

  async function refreshTrackedLeagues() {
    const res = await fetch('/api/admin/leagues');
    if (res.ok) {
      const json = await res.json();
      setTrackedLeagues(json.leagues ?? []);
    }
  }

  useEffect(() => {
    refreshAll();
    refreshTrackedLeagues();
    refreshAutopilot();
  }, []);

  async function refreshAutopilot() {
    const [settingsRes, pendingRes] = await Promise.all([fetch('/api/admin/autopilot'), fetch('/api/admin/autopilot/review')]);
    if (settingsRes.ok) {
      const json = await settingsRes.json();
      setAutopilotSettings(json.settings);
      setAutopilotProviders(json.providers ?? []);
    }
    if (pendingRes.ok) {
      const json = await pendingRes.json();
      setPendingArticles(json.items ?? []);
    }
  }

  async function handleSaveAutopilotSettings(patch: any) {
    setAutopilotBusy(true);
    try {
      const res = await fetch('/api/admin/autopilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const json = await res.json();
      if (res.ok) {
        setAutopilotSettings(json.settings);
      } else {
        alert(`فشل الحفظ (${res.status}): ${json.error || 'خطأ غير معروف'}`);
      }
    } catch (e: any) {
      alert(`فشل الحفظ: ${e?.message ?? 'تحقق من اتصالك بالإنترنت'}`);
    } finally {
      setAutopilotBusy(false);
    }
  }

  function handleAddRssSource() {
    if (!newRssName.trim() || !newRssUrl.trim()) return;
    const next = [...(autopilotSettings?.rss_sources ?? []), { name: newRssName.trim(), url: newRssUrl.trim() }];
    handleSaveAutopilotSettings({ rss_sources: next });
    setNewRssName('');
    setNewRssUrl('');
  }

  function handleRemoveRssSource(url: string) {
    const next = (autopilotSettings?.rss_sources ?? []).filter((s: any) => s.url !== url);
    handleSaveAutopilotSettings({ rss_sources: next });
  }

  async function handleReviewAction(id: string, action: 'publish-now' | 'reject') {
    const res = await fetch('/api/admin/autopilot/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      alert(`فشل الإجراء (${res.status}): ${json.error || 'خطأ غير معروف'}`);
      return;
    }
    refreshAutopilot();
    refreshAll();
  }

  async function handleSearchLeagues(e: React.FormEvent) {
    e.preventDefault();
    if (!leagueQuery.trim()) return;
    setLeagueSearching(true);
    setLeagueSearchError(null);
    try {
      const res = await fetch(`/api/admin/leagues?q=${encodeURIComponent(leagueQuery.trim())}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'فشل البحث');
      setLeagueResults(json.results ?? []);
    } catch (e: any) {
      setLeagueSearchError(e?.message ?? 'فشل البحث');
    } finally {
      setLeagueSearching(false);
    }
  }

  async function handleAddLeague(result: any) {
    if (!result.currentSeason) {
      alert('ما قدرنا نحدد الموسم الحالي لهذا الدوري تلقائيًا من API-Football.');
      return;
    }
    const res = await fetch('/api/admin/leagues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leagueApiId: result.leagueApiId,
        season: result.currentSeason,
        name: result.name,
        country: result.country,
        logo: result.logo,
      }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      alert(`فشل إضافة الدوري (${res.status}): ${json.error || 'خطأ غير معروف'}`);
      return;
    }
    refreshTrackedLeagues();
  }

  async function handleRemoveLeague(id: string) {
    if (!confirm('إيقاف متابعة هذا الدوري؟ المباريات المستوردة سابقًا بتفضل موجودة، بس ما بتتحدث تلقائيًا بعد كذا.')) return;
    const res = await fetch('/api/admin/leagues', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      alert(`فشل الحذف (${res.status}): ${json.error || 'خطأ غير معروف'}`);
      return;
    }
    refreshTrackedLeagues();
  }

  function parseImportFile(text: string, isCsv: boolean): { club_api_id: number; player_api_id: number }[] {
    if (!isCsv) {
      const json = JSON.parse(text);
      const list = Array.isArray(json) ? json : json.rows;
      if (!Array.isArray(list)) throw new Error('الملف لازم يكون مصفوفة JSON أو كائن فيه مفتاح rows.');
      return list.map((r: any) => ({ club_api_id: Number(r.club_api_id), player_api_id: Number(r.player_api_id) }));
    }
    const lines = text.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) throw new Error('ملف CSV فاضي أو ناقص صفوف.');
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const clubIdx = headers.indexOf('club_api_id');
    const playerIdx = headers.indexOf('player_api_id');
    if (clubIdx === -1 || playerIdx === -1) throw new Error('ملف CSV لازم يحتوي عمودين باسم club_api_id و player_api_id.');
    return lines.slice(1).map((line) => {
      const cols = line.split(',');
      return { club_api_id: Number(cols[clubIdx]?.trim()), player_api_id: Number(cols[playerIdx]?.trim()) };
    });
  }

  async function handleSearchIds(e: React.FormEvent) {
    e.preventDefault();
    if (idSearchQuery.trim().length < 3) {
      setIdSearchError('اكتب 3 أحرف على الأقل');
      return;
    }
    setIdSearching(true);
    setIdSearchError(null);
    try {
      const res = await fetch(`/api/admin/search-ids?type=${idSearchType}&q=${encodeURIComponent(idSearchQuery.trim())}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'فشل البحث');
      setIdSearchResults(json.results ?? []);
    } catch (e: any) {
      setIdSearchError(e?.message ?? 'فشل البحث');
    } finally {
      setIdSearching(false);
    }
  }

  function handleCopyId(id: number) {
    navigator.clipboard.writeText(String(id));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportError(null);
    setImportSummary(null);
    try {
      const text = await file.text();
      const isCsv = file.name.toLowerCase().endsWith('.csv');
      const rows = parseImportFile(text, isCsv);
      const res = await fetch('/api/admin/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'فشل الاستيراد');
      setImportSummary(json.summary);
      refreshAll();
    } catch (err: any) {
      setImportError(err?.message ?? 'فشل قراءة أو استيراد الملف');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  }

  if (loading || !isAdmin) {
    return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--fg-faint)]">جارٍ التحقق من الصلاحيات...</div>;
  }

  async function handleSaveArticle(articleData: Article) {
    if (articleData.id && !articleData.id.startsWith('new-')) {
      await data.updateArticle(articleData);
    } else {
      const newArticle: Article = { ...articleData, id: `article-${Date.now()}`, date: new Date().toISOString(), author: currentUser?.name || 'Admin', views: 0 };
      await data.addArticle(newArticle);
    }
    setEditingArticle(null);
    refreshAll();
  }

  async function handleDeleteArticle(id: string) {
    if (confirm('هل أنت متأكد أنك تريد حذف هذا المقال؟')) {
      await data.deleteArticle(id);
      refreshAll();
    }
  }

  async function handleToggleUserStatus(user: User) {
    const newStatus = user.status === 'active' ? 'banned' : 'active';
    if (confirm(`هل أنت متأكد أنك تريد ${newStatus === 'banned' ? 'حظر' : 'إلغاء حظر'} هذا المستخدم؟`)) {
      await data.updateUserStatus(user.id, newStatus);
      refreshAll();
    }
  }

  async function handleDeleteUser(id: string, name: string) {
    if (confirm(`هل أنت متأكد أنك تريد حذف المستخدم ${name} بشكل دائم؟`)) {
      await data.deleteUser(id);
      refreshAll();
    }
  }

  async function handleModerate(id: string, status: Comment['status']) {
    await data.updateCommentStatus(id, status);
    refreshAll();
  }

  async function handleSaveClub(clubData: ClubProfile) {
    const exists = clubs.some((c) => c.id === clubData.id);
    if (exists) await data.updateClub(clubData);
    else await data.addClub(clubData);
    setEditingClub(null);
    refreshAll();
  }

  async function handleDeleteClub(id: string) {
    if (confirm('هل أنت متأكد أنك تريد حذف هذا النادي؟')) {
      await data.deleteClub(id);
      refreshAll();
    }
  }

  async function handleToggleSponsor(sponsor: Sponsor) {
    await data.updateSponsor({ ...sponsor, active: !sponsor.active });
    refreshAll();
  }

  async function handleDeleteSponsor(id: string) {
    if (confirm('هل تريد حذف هذا الراعي؟')) {
      await data.deleteSponsor(id);
      refreshAll();
    }
  }

  async function handleAddSponsor() {
    const name = prompt('اسم الراعي:');
    if (!name) return;
    await data.addSponsor({ id: `sponsor-${Date.now()}`, name, logo: '', url: '', active: true });
    refreshAll();
  }

  async function handleSaveSeo(e: React.FormEvent) {
    e.preventDefault();
    if (!seoSettings) return;
    await data.updateSeoSettings(seoSettings);
    alert('تم حفظ إعدادات SEO');
  }

  async function handleToggleFlag(key: keyof FeatureFlags) {
    if (!featureFlags) return;
    const newValue = !featureFlags[key];
    await data.setFeatureFlag(key, newValue);
    refreshAll();
  }

  async function handleSaveAdSlot(slotData: AdSlot) {
    const exists = adSlots.some((s) => s.id === slotData.id);
    if (exists) await data.updateAdSlot(slotData);
    else await data.addAdSlot(slotData);
    setEditingAdSlot(null);
    refreshAll();
  }

  async function handleDeleteAdSlot(id: string) {
    if (confirm('هل أنت متأكد أنك تريد حذف هذه الفتحة الإعلانية؟')) {
      await data.deleteAdSlot(id);
      refreshAll();
    }
  }

  async function handleToggleAdSlot(slotItem: AdSlot) {
    await data.updateAdSlot({ ...slotItem, enabled: !slotItem.enabled });
    refreshAll();
  }

  async function handleToggleAdsKillSwitch() {
    if (!adsGlobal) return;
    const next = { ...adsGlobal, masterEnabled: !adsGlobal.masterEnabled };
    if (!next.masterEnabled && !confirm('هذا سيوقف كل الإعلانات بالموقع فورًا لجميع الزوار. متأكد؟')) return;
    await data.updateAdsGlobalSettings(next);
    refreshAll();
  }

  async function handleSaveAdsTxt(e: React.FormEvent) {
    e.preventDefault();
    if (!adsGlobal) return;
    await data.updateAdsGlobalSettings(adsGlobal);
    alert('تم حفظ ملف ads.txt');
  }

  const NAV_GROUPS: { group: string; items: { key: AdminTab; label: string; icon: typeof LayoutGrid }[] }[] = [
    { group: 'عام', items: [{ key: 'OVERVIEW', label: 'نظرة عامة', icon: LayoutGrid }] },
    {
      group: 'المحتوى',
      items: [
        { key: 'ARTICLES', label: 'المقالات', icon: FileText },
        { key: 'CLUBS', label: 'الأندية', icon: ShoppingBag },
      ],
    },
    {
      group: 'المجتمع',
      items: [
        { key: 'USERS', label: 'المستخدمون', icon: Users },
        { key: 'MODERATION', label: 'مراقبة التعليقات', icon: MessageCircle },
      ],
    },
    {
      group: 'الموقع',
      items: [
        { key: 'ADS', label: 'الإعلانات', icon: Megaphone },
        { key: 'AUTOPILOT', label: 'الأتمتة (RSS + AI)', icon: Bot },
        { key: 'LEAGUES', label: 'الدوريات المتابَعة', icon: Trophy },
        { key: 'SPONSORS', label: 'الرعاة', icon: ShoppingBag },
        { key: 'SEO', label: 'SEO', icon: Globe },
        { key: 'SETTINGS', label: 'الإعدادات العامة', icon: Settings },
        ...COMING_SOON_TABS,
      ],
    },
  ];

  const activeTabMeta = NAV_GROUPS.flatMap((g) => g.items).find((i) => i.key === activeTab);

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col lg:flex-row">
      <aside className="lg:w-64 lg:h-screen lg:sticky lg:top-0 bg-[var(--bg-surface)] border-b lg:border-b-0 lg:border-l border-[var(--border-subtle)] flex-shrink-0 flex flex-col">
        <div className="flex items-center gap-2 p-4 border-b border-[var(--border-subtle)]">
          <Shield className="text-red-500" size={24} />
          <span className="font-black text-[var(--fg)] text-lg">لوحة التحكم</span>
        </div>

        <nav className="flex-1 lg:overflow-y-auto p-3">
          <div className="flex lg:hidden gap-1 overflow-x-auto no-scrollbar">
            {NAV_GROUPS.flatMap((g) => g.items).map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
                  activeTab === item.key ? 'bg-primary/10 text-primary' : 'text-[var(--fg-subtle)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--fg)]'
                }`}
              >
                <item.icon size={16} /> {item.label}
              </button>
            ))}
          </div>

          <div className="hidden lg:block space-y-5">
            {NAV_GROUPS.map((group) => (
              <div key={group.group}>
                <p className="px-3 mb-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--fg-faint)]">{group.group}</p>
                <div className="flex flex-col gap-1">
                  {group.items.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setActiveTab(item.key)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
                        activeTab === item.key ? 'bg-primary/10 text-primary' : 'text-[var(--fg-subtle)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--fg)]'
                      }`}
                    >
                      <item.icon size={16} /> {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div className="border-t border-[var(--border-subtle)] p-3 space-y-1">
          <Link href="/" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold text-[var(--fg-subtle)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--fg)] transition-colors">
            <Home size={16} /> العودة للموقع
          </Link>
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2 min-w-0 px-2 py-2">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--bg-surface-2)] flex items-center justify-center flex-shrink-0">
                {currentUser?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentUser.avatar} alt={currentUser.username} className="w-full h-full object-cover" />
                ) : (
                  <Shield size={14} className="text-[var(--fg-faint)]" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[var(--fg)] truncate">{currentUser?.name}</p>
                <p className="text-[10px] text-[var(--fg-faint)] truncate">مدير الموقع</p>
              </div>
            </div>
            <button onClick={handleLogout} title="تسجيل الخروج" className="flex-shrink-0 p-2 rounded-lg text-[var(--fg-faint)] hover:bg-red-500/10 hover:text-red-500 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 min-w-0">
        {activeTab !== 'OVERVIEW' && activeTabMeta && (
          <p className="text-xs font-bold text-[var(--fg-faint)] mb-1">لوحة التحكم / {activeTabMeta.label}</p>
        )}

        {activeTab === 'OVERVIEW' && (
          <div>
            <h1 className="text-2xl font-black text-[var(--fg)] mb-1">نظرة عامة</h1>
            <p className="text-sm text-[var(--fg-faint)] mb-6">مرحبًا {currentUser?.name}، هذا ملخص سريع لحالة الموقع.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard label="المقالات" value={articles.length} icon={FileText} />
              <StatCard label="المستخدمون" value={users.length} icon={Users} />
              <StatCard label="الأندية" value={clubs.length} icon={ShoppingBag} />
              <StatCard label="الرعاة" value={sponsors.length} icon={ShoppingBag} />
              <StatCard label="فتحات الإعلانات المفعّلة" value={adSlots.filter((s) => s.enabled).length} icon={Megaphone} />
              <StatCard label="التعليقات" value={comments.length} icon={MessageCircle} />
              <StatCard label="مقالات عاجلة" value={articles.filter((a) => a.isBreaking).length} icon={Clock} />
              <StatCard label="تعليقات مُبلَّغ عنها" value={comments.filter((c) => c.status === 'reported').length} icon={MessageCircle} />
              <StatCard label="مستخدمون محظورون" value={users.filter((u) => u.status === 'banned').length} icon={Ban} />
            </div>

            <h2 className="text-sm font-black text-[var(--fg-subtle)] mb-3">اختصارات سريعة</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button onClick={() => { setEditorMode('NEW'); setEditingArticle({ id: 'new-article', title: '', summary: '', content: '', category: Category.SAUDI, imageUrl: '' }); }} className="flex items-center gap-2 p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl hover:border-primary/50 transition-colors text-sm font-bold text-[var(--fg-muted)] hover:text-primary">
                <Plus size={16} /> مقال جديد
              </button>
              <button onClick={() => setActiveTab('MODERATION')} className="flex items-center gap-2 p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl hover:border-primary/50 transition-colors text-sm font-bold text-[var(--fg-muted)] hover:text-primary">
                <MessageCircle size={16} /> مراقبة التعليقات
              </button>
              <button onClick={() => setActiveTab('USERS')} className="flex items-center gap-2 p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl hover:border-primary/50 transition-colors text-sm font-bold text-[var(--fg-muted)] hover:text-primary">
                <Users size={16} /> إدارة المستخدمين
              </button>
              <button onClick={() => setActiveTab('SETTINGS')} className="flex items-center gap-2 p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl hover:border-primary/50 transition-colors text-sm font-bold text-[var(--fg-muted)] hover:text-primary">
                <Settings size={16} /> إعدادات الموقع
              </button>
            </div>
          </div>
        )}

        {activeTab === 'ARTICLES' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-black text-[var(--fg)]">المقالات ({articles.length})</h1>
              <button
                onClick={() => {
                  setEditorMode('NEW');
                  setEditingArticle({ id: 'new-article', title: '', summary: '', content: '', category: Category.SAUDI, imageUrl: '' });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-emerald-600 text-[var(--fg)] rounded-lg font-bold text-sm"
              >
                <Plus size={16} /> مقال جديد
              </button>
            </div>

            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[var(--bg-surface-2)] text-[var(--fg-subtle)] text-xs">
                  <tr>
                    <th className="p-3 text-right">العنوان</th>
                    <th className="p-3 text-right">التصنيف</th>
                    <th className="p-3 text-center">المشاهدات</th>
                    <th className="p-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {articles.map((article) => (
                    <tr key={article.id} className="hover:bg-[color-mix(in_srgb,var(--bg-surface-2)_30%,transparent)]">
                      <td className="p-3 text-[var(--fg)] font-bold max-w-xs truncate">{article.title}</td>
                      <td className="p-3 text-[var(--fg-subtle)]">{article.category}</td>
                      <td className="p-3 text-center text-[var(--fg-subtle)]">{article.views.toLocaleString()}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditorMode('EDIT');
                              setEditingArticle(article);
                            }}
                            className="p-1.5 bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] rounded text-[var(--fg-muted)]"
                          >
                            <Edit size={14} />
                          </button>
                          <button onClick={() => handleDeleteArticle(article.id)} className="p-1.5 bg-[var(--bg-surface-2)] hover:bg-red-500/20 hover:text-red-500 rounded text-[var(--fg-muted)]">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'USERS' && (
          <div>
            <h1 className="text-2xl font-black text-[var(--fg)] mb-6">المستخدمون ({users.length})</h1>
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[var(--bg-surface-2)] text-[var(--fg-subtle)] text-xs">
                  <tr>
                    <th className="p-3 text-right">المستخدم</th>
                    <th className="p-3 text-right">البريد</th>
                    <th className="p-3 text-center">الحالة</th>
                    <th className="p-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-[color-mix(in_srgb,var(--bg-surface-2)_30%,transparent)]">
                      <td className="p-3 text-[var(--fg)] font-bold">{user.name} <span className="text-[var(--fg-faint)] font-normal">@{user.username}</span></td>
                      <td className="p-3 text-[var(--fg-subtle)]">{user.email}</td>
                      <td className="p-3 text-center">
                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${user.status === 'banned' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                          {user.status === 'banned' ? 'محظور' : 'نشط'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleToggleUserStatus(user)} className="p-1.5 bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] rounded text-[var(--fg-muted)]" title={user.status === 'banned' ? 'إلغاء الحظر' : 'حظر'}>
                            {user.status === 'banned' ? <Check size={14} /> : <Ban size={14} />}
                          </button>
                          <button onClick={() => handleDeleteUser(user.id, user.name)} className="p-1.5 bg-[var(--bg-surface-2)] hover:bg-red-500/20 hover:text-red-500 rounded text-[var(--fg-muted)]">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'MODERATION' && (
          <div>
            <h1 className="text-2xl font-black text-[var(--fg)] mb-6">مراقبة التعليقات ({comments.length})</h1>
            {comments.length === 0 ? (
              <div className="text-center py-20 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] border-dashed text-[var(--fg-faint)]">لا توجد تعليقات بعد.</div>
            ) : (
              <div className="space-y-3">
                {comments.map((c) => (
                  <div key={c.id} className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[var(--fg)]">{c.user}</p>
                      <p className="text-sm text-[var(--fg-subtle)] truncate">{c.text}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${c.status === 'reported' ? 'bg-amber-500/10 text-amber-400' : c.status === 'hidden' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {c.status === 'reported' ? 'مُبلَّغ عنه' : c.status === 'hidden' ? 'مخفي' : 'ظاهر'}
                      </span>
                      {c.status !== 'hidden' && (
                        <button onClick={() => handleModerate(c.id, 'hidden')} className="p-1.5 bg-[var(--bg-surface-2)] hover:bg-red-500/20 hover:text-red-500 rounded text-[var(--fg-muted)]">
                          <Trash2 size={14} />
                        </button>
                      )}
                      {c.status !== 'visible' && (
                        <button onClick={() => handleModerate(c.id, 'visible')} className="p-1.5 bg-[var(--bg-surface-2)] hover:bg-emerald-500/20 hover:text-emerald-500 rounded text-[var(--fg-muted)]">
                          <Check size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'CLUBS' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-black text-[var(--fg)]">الأندية ({clubs.length})</h1>
              <button
                onClick={() =>
                  setEditingClub({
                    id: `club-${Date.now()}`,
                    name: '',
                    englishName: '',
                    apiFootballId: 0,
                    logo: '',
                    coverImage: '',
                    founded: new Date().getFullYear(),
                    stadium: '',
                    coach: '',
                    nickname: '',
                    colors: { primary: '#10b981', secondary: '#0f172a', text: '#ffffff' },
                    social: { twitter: '', instagram: '' },
                    fanCount: 0,
                    squad: [],
                    trophies: [],
                    country: Category.SAUDI,
                  })
                }
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-emerald-600 text-[var(--fg)] rounded-lg font-bold text-sm"
              >
                <Plus size={16} /> نادٍ جديد
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {clubs.map((club) => (
                <div key={club.id} className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-[var(--fg)] truncate">{club.name}</p>
                    <p className="text-xs text-[var(--fg-faint)]">{club.country}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => setEditingClub(club)} className="p-1.5 bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] rounded text-[var(--fg-muted)]">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => handleDeleteClub(club.id)} className="p-1.5 bg-[var(--bg-surface-2)] hover:bg-red-500/20 hover:text-red-500 rounded text-[var(--fg-muted)]">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'SPONSORS' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-black text-[var(--fg)]">الرعاة ({sponsors.length})</h1>
              <button onClick={handleAddSponsor} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-emerald-600 text-[var(--fg)] rounded-lg font-bold text-sm">
                <Plus size={16} /> راعٍ جديد
              </button>
            </div>
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[var(--bg-surface-2)] text-[var(--fg-subtle)] text-xs">
                  <tr>
                    <th className="p-3 text-right">الاسم</th>
                    <th className="p-3 text-center">الحالة</th>
                    <th className="p-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {sponsors.map((s) => (
                    <tr key={s.id} className="hover:bg-[color-mix(in_srgb,var(--bg-surface-2)_30%,transparent)]">
                      <td className="p-3 text-[var(--fg)] font-bold">{s.name}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleToggleSponsor(s)}
                          className={`text-xs px-2 py-1 rounded-full font-bold ${s.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[var(--bg-surface-2)] text-[var(--fg-faint)]'}`}
                        >
                          {s.active ? 'مفعّل' : 'موقوف'}
                        </button>
                      </td>
                      <td className="p-3 text-center">
                        <button onClick={() => handleDeleteSponsor(s.id)} className="p-1.5 bg-[var(--bg-surface-2)] hover:bg-red-500/20 hover:text-red-500 rounded text-[var(--fg-muted)] mx-auto">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'ADS' && adsGlobal && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-black text-[var(--fg)]">الإعلانات ({adSlots.length})</h1>
              <button
                onClick={() =>
                  setEditingAdSlot({
                    id: `ad-${Date.now()}`,
                    placement: 'HOME_TOP',
                    label: '',
                    network: 'adsense',
                    code: '',
                    enabled: false,
                    pages: ['all'],
                  })
                }
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-emerald-600 text-[var(--fg)] rounded-lg font-bold text-sm"
              >
                <Plus size={16} /> فتحة إعلانية جديدة
              </button>
            </div>

            <div
              className={`mb-6 rounded-2xl p-5 border flex items-center justify-between gap-4 flex-wrap ${
                adsGlobal.masterEnabled ? 'bg-[var(--bg-surface)] border-[var(--border-subtle)]' : 'bg-red-500/5 border-red-500/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${adsGlobal.masterEnabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                  <Power size={20} />
                </div>
                <div>
                  <p className="font-bold text-[var(--fg)]">{adsGlobal.masterEnabled ? 'الإعلانات مفعّلة بالموقع' : 'كل الإعلانات موقوفة الآن'}</p>
                  <p className="text-xs text-[var(--fg-faint)]">مفتاح إيقاف طارئ يوقف كل الفتحات دفعة واحدة بغضّ النظر عن حالتها الفردية.</p>
                </div>
              </div>
              <button
                onClick={handleToggleAdsKillSwitch}
                className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap ${
                  adsGlobal.masterEnabled ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                }`}
              >
                {adsGlobal.masterEnabled ? 'إيقاف الكل' : 'إعادة التفعيل'}
              </button>
            </div>

            {adSlots.length === 0 ? (
              <div className="text-center py-16 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] border-dashed text-[var(--fg-faint)] mb-8">
                لا توجد فتحات إعلانية بعد — أضف أول فتحة من الزر أعلاه.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {adSlots.map((s) => (
                  <div key={s.id} className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <p className="font-bold text-[var(--fg)] truncate">{s.label || AD_PLACEMENT_LABELS[s.placement]}</p>
                        <p className="text-xs text-[var(--fg-faint)]">{AD_PLACEMENT_LABELS[s.placement]}</p>
                      </div>
                      <span
                        className={`text-[10px] font-black px-2 py-1 rounded-full flex-shrink-0 ${
                          s.network === 'adsense' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {s.network === 'adsense' ? 'AdSense' : s.network === 'direct' ? 'راعٍ مباشر' : 'أخرى'}
                      </span>
                    </div>

                    {(s.startDate || s.endDate) && (
                      <p className="text-[10px] text-[var(--fg-faint)] mb-2">
                        📅 {s.startDate || '—'} → {s.endDate || 'بلا نهاية'}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border-subtle)]">
                      <button
                        onClick={() => handleToggleAdSlot(s)}
                        className={`text-xs px-2 py-1 rounded-full font-bold ${s.enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[var(--bg-surface-2)] text-[var(--fg-faint)]'}`}
                      >
                        {s.enabled ? 'مفعّلة' : 'موقوفة'}
                      </button>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditingAdSlot(s)} className="p-1.5 bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] rounded text-[var(--fg-muted)]">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => handleDeleteAdSlot(s.id)} className="p-1.5 bg-[var(--bg-surface-2)] hover:bg-red-500/20 hover:text-red-500 rounded text-[var(--fg-muted)]">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="max-w-2xl">
              <h2 className="text-lg font-black text-[var(--fg)] mb-3">ملف ads.txt</h2>
              <p className="text-xs text-[var(--fg-faint)] mb-3">مطلوب من Google لاعتماد حساب AdSense على النطاق — الصق هنا السطر اللي يعطيك ياه AdSense.</p>
              <form onSubmit={handleSaveAdsTxt} className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 space-y-4">
                <textarea
                  value={adsGlobal.adsTxtContent}
                  onChange={(e) => setAdsGlobal({ ...adsGlobal, adsTxtContent: e.target.value })}
                  rows={4}
                  dir="ltr"
                  placeholder="google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0"
                  className="w-full bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)] font-mono text-sm"
                />
                <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-emerald-600 text-[var(--fg)] rounded-lg font-bold text-sm">
                  <Save size={16} /> حفظ ads.txt
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'AUTOPILOT' && autopilotSettings && (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-black text-[var(--fg)]">الأتمتة (RSS + AI)</h1>
              <p className="text-sm text-[var(--fg-faint)] mt-1">استيراد أخبار من RSS، إعادة صياغتها بالذكاء الاصطناعي، ونشرها تلقائيًا بعد {autopilotSettings.review_window_minutes} دقائق ما لم تراجعها.</p>
            </div>

            {/* Master toggle + provider + review window */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 mb-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-[var(--fg)]">تفعيل الأتمتة</p>
                  <p className="text-xs text-[var(--fg-faint)]">لما توقفها، الاستيراد التلقائي يتوقف بالكامل.</p>
                </div>
                <button
                  onClick={() => handleSaveAutopilotSettings({ enabled: !autopilotSettings.enabled })}
                  disabled={autopilotBusy}
                  className={`px-4 py-2 rounded-lg text-sm font-bold ${autopilotSettings.enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[var(--bg-surface-2)] text-[var(--fg-faint)]'}`}
                >
                  {autopilotSettings.enabled ? 'مفعّلة' : 'موقوفة'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--border-subtle)]">
                <div>
                  <label className="block text-sm text-[var(--fg-subtle)] mb-1.5">نموذج الذكاء الاصطناعي</label>
                  <select
                    value={autopilotSettings.active_provider}
                    onChange={(e) => handleSaveAutopilotSettings({ active_provider: e.target.value })}
                    className="w-full bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--fg)]"
                  >
                    {autopilotProviders.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} {p.configured ? '' : '— بدون مفتاح API'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[var(--fg-subtle)] mb-1.5">مهلة المراجعة (دقائق)</label>
                  <input
                    type="number"
                    min={0}
                    value={autopilotSettings.review_window_minutes}
                    onChange={(e) => setAutopilotSettings({ ...autopilotSettings, review_window_minutes: Number(e.target.value) })}
                    onBlur={(e) => handleSaveAutopilotSettings({ review_window_minutes: Number(e.target.value) })}
                    className="w-full bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--fg)]"
                  />
                </div>
              </div>

              {!autopilotProviders.find((p) => p.id === autopilotSettings.active_provider)?.configured && (
                <p className="text-xs text-amber-500">⚠️ ما فيه مفتاح API مضبوط لهذا النموذج بـ .env.local — الاستيراد بيفشل لين تضيفه.</p>
              )}
            </div>

            {/* RSS sources */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 mb-6">
              <h2 className="font-bold text-[var(--fg)] mb-3">مصادر RSS</h2>
              <div className="space-y-2 mb-4">
                {(autopilotSettings.rss_sources ?? []).length === 0 && (
                  <p className="text-xs text-[var(--fg-faint)]">ما فيه مصادر مضافة بعد.</p>
                )}
                {(autopilotSettings.rss_sources ?? []).map((s: any) => (
                  <div key={s.url} className="flex items-center justify-between gap-2 bg-[var(--bg-base)] rounded-lg p-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[var(--fg)] truncate">{s.name}</p>
                      <p className="text-[10px] text-[var(--fg-faint)] truncate" dir="ltr">{s.url}</p>
                    </div>
                    <button onClick={() => handleRemoveRssSource(s.url)} className="flex-shrink-0 p-1.5 rounded-lg text-[var(--fg-faint)] hover:bg-red-500/10 hover:text-red-500">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input value={newRssName} onChange={(e) => setNewRssName(e.target.value)} placeholder="اسم المصدر" className="flex-1 bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--fg)]" />
                <input value={newRssUrl} onChange={(e) => setNewRssUrl(e.target.value)} placeholder="https://example.com/feed" dir="ltr" className="flex-[2] bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--fg)]" />
                <button onClick={handleAddRssSource} className="px-4 py-2 bg-primary hover:bg-emerald-600 text-white rounded-lg text-sm font-bold whitespace-nowrap">إضافة</button>
              </div>
            </div>

            {/* Review queue */}
            <div>
              <h2 className="font-bold text-[var(--fg)] mb-3">طابور المراجعة ({pendingArticles.filter((p) => p.status === 'PENDING').length})</h2>
              {pendingArticles.filter((p) => p.status === 'PENDING').length === 0 ? (
                <div className="text-center py-12 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] border-dashed text-[var(--fg-faint)]">
                  ما فيه مقالات بانتظار المراجعة حاليًا.
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingArticles.filter((p) => p.status === 'PENDING').map((item) => {
                    const autoPublishAt = new Date(new Date(item.created_at).getTime() + autopilotSettings.review_window_minutes * 60000);
                    return (
                      <div key={item.id} className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="min-w-0">
                            <p className="font-bold text-[var(--fg)]">{item.title}</p>
                            <p className="text-xs text-[var(--fg-faint)] mt-1">{item.source_name} • {item.ai_provider} • ينشر تلقائيًا الساعة {autoPublishAt.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })} ما لم تتصرف</p>
                          </div>
                        </div>
                        <p className="text-sm text-[var(--fg-muted)] line-clamp-2 mb-3">{item.summary}</p>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleReviewAction(item.id, 'publish-now')} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20">
                            نشر الآن
                          </button>
                          <button onClick={() => handleReviewAction(item.id, 'reject')} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/10 text-red-500 hover:bg-red-500/20">
                            رفض
                          </button>
                          <a href={item.source_url} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--bg-surface-2)] text-[var(--fg-faint)] hover:text-[var(--fg)]">
                            المصدر الأصلي
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'LEAGUES' && (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-black text-[var(--fg)]">الدوريات المتابَعة ({trackedLeagues.length})</h1>
              <p className="text-sm text-[var(--fg-faint)] mt-1">
                الدوريات هنا تُستورد مبارياتها تلقائيًا كل يوم من API-Football، وتُحدَّث نتائجها وإحصائيات لاعبيها فور انتهاء كل مباراة.
              </p>
            </div>

            <form onSubmit={handleSearchLeagues} className="flex gap-2 mb-6 max-w-lg">
              <div className="relative flex-1">
                <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-faint)]" />
                <input
                  value={leagueQuery}
                  onChange={(e) => setLeagueQuery(e.target.value)}
                  placeholder="ابحث باسم الدوري... مثال: Saudi"
                  className="w-full bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-lg pr-9 pl-3 py-2 text-sm text-[var(--fg)]"
                />
              </div>
              <button type="submit" disabled={leagueSearching} className="px-4 py-2 bg-primary hover:bg-emerald-600 text-white rounded-lg text-sm font-bold disabled:opacity-50">
                {leagueSearching ? 'جارٍ البحث...' : 'بحث'}
              </button>
            </form>

            {leagueSearchError && <p className="text-sm text-red-500 mb-4">{leagueSearchError}</p>}

            {leagueResults.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-black text-[var(--fg-subtle)] mb-2">نتائج البحث</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {leagueResults.map((r) => {
                    const alreadyTracked = trackedLeagues.some((t) => t.league_api_id === r.leagueApiId && t.season === r.currentSeason);
                    return (
                      <div key={r.leagueApiId} className="flex items-center justify-between gap-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-3">
                        <div className="min-w-0">
                          <p className="font-bold text-[var(--fg)] truncate">{r.name}</p>
                          <p className="text-xs text-[var(--fg-faint)]">{r.country || '—'} {r.currentSeason ? `• موسم ${r.currentSeason}` : '• لا يوجد موسم حالي'}</p>
                        </div>
                        <button
                          onClick={() => handleAddLeague(r)}
                          disabled={alreadyTracked || !r.currentSeason}
                          className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {alreadyTracked ? 'مُتابَع' : 'إضافة'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <h2 className="text-sm font-black text-[var(--fg-subtle)] mb-2">الدوريات المفعّلة الآن</h2>
            {trackedLeagues.length === 0 ? (
              <div className="text-center py-12 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] border-dashed text-[var(--fg-faint)]">
                ما فيه دوريات متابَعة بعد — ابحث فوق وأضف أول دوري (مثل الدوري السعودي).
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {trackedLeagues.map((l) => (
                  <div key={l.id} className="flex items-center justify-between gap-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-3">
                    <div className="min-w-0">
                      <p className="font-bold text-[var(--fg)] truncate">{l.name}</p>
                      <p className="text-xs text-[var(--fg-faint)]">{l.country || '—'} • موسم {l.season}</p>
                    </div>
                    <button onClick={() => handleRemoveLeague(l.id)} className="flex-shrink-0 p-2 rounded-lg text-[var(--fg-faint)] hover:bg-red-500/10 hover:text-red-500">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-10 pt-8 border-t border-[var(--border-subtle)] max-w-2xl">
              <h2 className="text-lg font-black text-[var(--fg)] mb-1">أداة البحث عن المعرّفات (نادٍ / لاعب)</h2>
              <p className="text-xs text-[var(--fg-faint)] mb-4">دوّر بالاسم على معرّف API-Football عشان تستخدمه بملف الاستيراد الجماعي تحت.</p>

              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6">
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => { setIdSearchType('team'); setIdSearchResults([]); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${idSearchType === 'team' ? 'bg-primary text-white' : 'bg-[var(--bg-surface-2)] text-[var(--fg-faint)]'}`}
                  >
                    نادٍ
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIdSearchType('player'); setIdSearchResults([]); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${idSearchType === 'player' ? 'bg-primary text-white' : 'bg-[var(--bg-surface-2)] text-[var(--fg-faint)]'}`}
                  >
                    لاعب
                  </button>
                </div>

                <form onSubmit={handleSearchIds} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-faint)]" />
                    <input
                      value={idSearchQuery}
                      onChange={(e) => setIdSearchQuery(e.target.value)}
                      placeholder={idSearchType === 'team' ? 'مثال: Al Hilal' : 'مثال: Cristiano Ronaldo'}
                      className="w-full bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-lg pr-9 pl-3 py-2 text-sm text-[var(--fg)]"
                    />
                  </div>
                  <button type="submit" disabled={idSearching} className="px-4 py-2 bg-primary hover:bg-emerald-600 text-white rounded-lg text-sm font-bold disabled:opacity-50">
                    {idSearching ? '...' : 'بحث'}
                  </button>
                </form>

                {idSearchError && <p className="text-sm text-red-500 mt-3">{idSearchError}</p>}

                {idSearchResults.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {idSearchResults.map((r) => {
                      const apiId = idSearchType === 'team' ? r.apiTeamId : r.apiPlayerId;
                      return (
                        <div key={apiId} className="flex items-center justify-between gap-3 bg-[var(--bg-base)] rounded-lg p-3">
                          <div className="flex items-center gap-2 min-w-0">
                            {(r.logo || r.photo) && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={r.logo || r.photo} alt={r.name} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-[var(--fg)] truncate">{r.name}</p>
                              <p className="text-[10px] text-[var(--fg-faint)] truncate">{idSearchType === 'team' ? r.country : r.teamName || '—'}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleCopyId(apiId)}
                            className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] text-[var(--fg-muted)]"
                          >
                            {copiedId === apiId ? 'تم النسخ ✓' : `#${apiId}`}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-[var(--border-subtle)] max-w-2xl">
              <h2 className="text-lg font-black text-[var(--fg)] mb-1">استيراد جماعي (JSON / CSV)</h2>
              <p className="text-xs text-[var(--fg-faint)] mb-4">
                لاستيراد نادي/فريق كامل دفعة وحدة بدل ما يتكوّن لاعب لاعب. الملف لازم يحتوي عمودين بس: <code dir="ltr" className="text-primary">club_api_id</code> و
                <code dir="ltr" className="text-primary"> player_api_id</code> (معرّفات API-Football). البيانات الفعلية (الاسم، المركز...) تُجلب دائمًا مباشرة من API-Football، مو من الملف.
              </p>

              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6">
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[var(--border)] rounded-xl py-8 cursor-pointer hover:border-primary/50 transition-colors">
                  <Plus size={20} className="text-[var(--fg-faint)]" />
                  <span className="text-sm font-bold text-[var(--fg-muted)]">{importing ? 'جارٍ الاستيراد...' : 'اختر ملف .json أو .csv'}</span>
                  <input type="file" accept=".json,.csv" onChange={handleImportFile} disabled={importing} className="hidden" />
                </label>

                {importError && <p className="text-sm text-red-500 mt-4">{importError}</p>}

                {importSummary && (
                  <div className="mt-4 space-y-2">
                    {importSummary.rateLimited && (
                      <p className="text-sm text-amber-500 font-bold">⚠️ توقف الاستيراد مؤقتًا بسبب تجاوز حد API-Football — أعد رفع نفس الملف بعد شوي وبيكمل من وين وقف.</p>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                      <div className="bg-[var(--bg-base)] rounded-lg p-3 text-center">
                        <span className="block text-xl font-black text-emerald-400">{importSummary.clubsCreated}</span>
                        <span className="text-[10px] text-[var(--fg-faint)]">نادٍ جديد</span>
                      </div>
                      <div className="bg-[var(--bg-base)] rounded-lg p-3 text-center">
                        <span className="block text-xl font-black text-emerald-400">{importSummary.playersCreated}</span>
                        <span className="text-[10px] text-[var(--fg-faint)]">لاعب جديد</span>
                      </div>
                      <div className="bg-[var(--bg-base)] rounded-lg p-3 text-center">
                        <span className="block text-xl font-black text-[var(--fg-faint)]">{importSummary.playersExisting}</span>
                        <span className="text-[10px] text-[var(--fg-faint)]">موجود مسبقًا</span>
                      </div>
                      {importSummary.playersFailed > 0 && (
                        <div className="bg-[var(--bg-base)] rounded-lg p-3 text-center">
                          <span className="block text-xl font-black text-red-500">{importSummary.playersFailed}</span>
                          <span className="text-[10px] text-[var(--fg-faint)]">فشل</span>
                        </div>
                      )}
                    </div>
                    {importSummary.errors?.length > 0 && (
                      <details className="text-xs text-[var(--fg-faint)] mt-2">
                        <summary className="cursor-pointer font-bold">تفاصيل الأخطاء ({importSummary.errors.length})</summary>
                        <ul className="mt-2 space-y-1 list-disc pr-4">
                          {importSummary.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}
                        </ul>
                      </details>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'SEO' && seoSettings && (
          <div className="max-w-2xl">
            <h1 className="text-2xl font-black text-[var(--fg)] mb-6">إعدادات SEO</h1>
            <form onSubmit={handleSaveSeo} className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 space-y-4">
              <div>
                <label className="block text-sm text-[var(--fg-subtle)] mb-1">عنوان الموقع</label>
                <input
                  value={seoSettings.siteTitle}
                  onChange={(e) => setSeoSettings({ ...seoSettings, siteTitle: e.target.value })}
                  className="w-full bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--fg-subtle)] mb-1">الوصف التعريفي (Meta Description)</label>
                <textarea
                  value={seoSettings.metaDescription}
                  onChange={(e) => setSeoSettings({ ...seoSettings, metaDescription: e.target.value })}
                  rows={3}
                  className="w-full bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--fg-subtle)] mb-1">الكلمات المفتاحية</label>
                <input
                  value={seoSettings.metaKeywords}
                  onChange={(e) => setSeoSettings({ ...seoSettings, metaKeywords: e.target.value })}
                  className="w-full bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--fg-subtle)] mb-1">رابط صورة المشاركة (OG Image)</label>
                <input
                  value={seoSettings.ogImageUrl}
                  onChange={(e) => setSeoSettings({ ...seoSettings, ogImageUrl: e.target.value })}
                  className="w-full bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)]"
                />
              </div>
              <button type="submit" className="px-4 py-2 bg-primary hover:bg-emerald-600 text-[var(--fg)] rounded-lg font-bold flex items-center gap-2">
                <Save size={16} /> حفظ الإعدادات
              </button>
            </form>
          </div>
        )}

        {activeTab === 'SETTINGS' && featureFlags && (
          <div className="max-w-xl">
            <h1 className="text-2xl font-black text-[var(--fg)] mb-6">تفعيل/تعطيل ميزات الموقع</h1>
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl divide-y divide-[var(--border-subtle)]">
              {(Object.keys(featureFlags) as (keyof FeatureFlags)[]).map((key) => (
                <div key={key} className="flex items-center justify-between p-4">
                  <span className="text-[var(--fg-muted)] font-bold">{key}</span>
                  <button
                    onClick={() => handleToggleFlag(key)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${featureFlags[key] ? 'bg-primary' : 'bg-[var(--bg-surface-3)]'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${featureFlags[key] ? 'right-0.5' : 'right-6'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {COMING_SOON_TABS.some((t) => t.key === activeTab) && (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-[color-mix(in_srgb,var(--bg-surface)_50%,transparent)] rounded-2xl border border-[var(--border-subtle)] border-dashed">
            {(() => {
              const tab = COMING_SOON_TABS.find((t) => t.key === activeTab)!;
              const Icon = tab.icon;
              return (
                <>
                  <Icon size={40} className="text-slate-700 mb-4" />
                  <h3 className="text-xl font-bold text-[var(--fg-muted)] mb-2">{tab.label} — قريبًا</h3>
                  <p className="text-[var(--fg-faint)] text-sm max-w-sm">{tab.note}</p>
                </>
              );
            })()}
          </div>
        )}
      </main>

      {editingArticle && (
        <ArticleEditor
          initialData={editingArticle}
          mode={editorMode}
          onSave={handleSaveArticle}
          onCancel={() => setEditingArticle(null)}
        />
      )}

      {editingClub && <ClubEditor initialData={editingClub} onSave={handleSaveClub} onCancel={() => setEditingClub(null)} />}
      {editingAdSlot && <AdSlotEditor initialData={editingAdSlot} onSave={handleSaveAdSlot} onCancel={() => setEditingAdSlot(null)} />}
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof FileText }) {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4">
      <Icon size={18} className="text-primary mb-2" />
      <div className="text-2xl font-black text-[var(--fg)]">{value}</div>
      <div className="text-xs text-[var(--fg-faint)] font-bold">{label}</div>
    </div>
  );
}
