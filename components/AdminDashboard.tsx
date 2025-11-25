import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Menu, 
  List, 
  Shield, 
  Globe, 
  DollarSign, 
  FilePlus,
  Edit,
  Trash2,
  Plus,
  X,
  User,
  Save,
  Wand2,
  ChevronDown,
  ChevronUp,
  ArrowRightLeft,
  Search,
  CheckCircle2,
  Settings,
  ToggleLeft,
  ToggleRight,
  Database,
  Key,
  Cpu,
  Trophy,
  Users,
  Loader2,
  UploadCloud
} from 'lucide-react';
import { Article, Category, ClubProfile, Player, PlayerStats, FeatureFlags, ApiConfig } from '../types';
import { useApp } from '../App';
import TeamLogo from './TeamLogo';
import { getSupabase } from '../services/supabaseClient';
import { INITIAL_ARTICLES, CLUB_DATABASE } from '../constants';

const AdminDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<'DASHBOARD' | 'EDITOR' | 'LIST' | 'SEO' | 'ADS' | 'CLUBS' | 'MERCATO' | 'SETTINGS'>('DASHBOARD');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { 
    clubs, addClub, updateClub, deleteClub, transferPlayer, 
    featureFlags, setFeatureFlag, apiConfig, setApiConfig 
  } = useApp();
  
  // Editor State
  const [editorData, setEditorData] = useState<Partial<Article>>({
    title: '',
    summary: '',
    content: '',
    imageUrl: '',
    category: Category.SAUDI,
    author: 'محرر Gulf Sports',
    videoEmbedId: ''
  });
  const [editorMode, setEditorMode] = useState<'NEW' | 'EDIT'>('NEW');

  const handleEditClick = (article: Article) => {
    setEditorData(article);
    setEditorMode('EDIT');
    setActiveView('EDITOR');
  };

  const handleNewClick = () => {
    setEditorData({
      title: '',
      summary: '',
      content: '',
      imageUrl: '',
      category: Category.SAUDI,
      author: 'محرر Gulf Sports',
      videoEmbedId: ''
    });
    setEditorMode('NEW');
    setActiveView('EDITOR');
  };

  const navItems = [
    { id: 'DASHBOARD', label: 'لوحة القيادة', icon: LayoutDashboard },
    { id: 'EDITOR', label: editorMode === 'EDIT' ? 'تعديل مقال' : 'إضافة مقال', icon: FilePlus },
    { id: 'LIST', label: 'إدارة المحتوى', icon: List },
    { id: 'CLUBS', label: 'إدارة الأندية', icon: Shield, hidden: !featureFlags.clubs },
    { id: 'MERCATO', label: 'سوق الانتقالات', icon: ArrowRightLeft, hidden: !featureFlags.mercato },
    { id: 'SEO', label: 'إعدادات SEO', icon: Globe },
    { id: 'ADS', label: 'إدارة الإعلانات', icon: DollarSign },
    { id: 'SETTINGS', label: 'الإعدادات والميزات', icon: Settings },
  ].filter(item => !item.hidden);

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Sidebar */}
      <aside 
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 border-l border-slate-800 transition-all duration-300 flex flex-col fixed h-full z-40`}
      >
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
           {isSidebarOpen && <span className="font-black text-white text-lg">لوحة التحكم</span>}
           <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-400 hover:text-white">
             <Menu size={20} />
           </button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
           {navItems.map(item => (
             <button
               key={item.id}
               onClick={() => {
                 if (item.id === 'EDITOR' && activeView !== 'EDITOR') handleNewClick();
                 else setActiveView(item.id as any);
               }}
               className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                 activeView === item.id ? 'bg-primary text-slate-900 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
               }`}
             >
               <item.icon size={20} />
               {isSidebarOpen && <span>{item.label}</span>}
             </button>
           ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
           {isSidebarOpen && <div className="text-xs text-slate-600 text-center">Gulf Sports CMS v1.2</div>}
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'mr-64' : 'mr-20'} p-6`}>
        {activeView === 'DASHBOARD' && <div className="text-white text-center p-10 bg-slate-900 rounded-xl border border-slate-800">مرحباً بك في لوحة التحكم</div>}
        {activeView === 'EDITOR' && <div className="text-white">Editor Placeholder</div>}
        {activeView === 'LIST' && <div className="text-white">List Placeholder</div>}
        
        {activeView === 'CLUBS' && featureFlags.clubs && (
           <ClubsManagerView 
              clubs={clubs}
              onAdd={addClub}
              onUpdate={updateClub}
              onDelete={deleteClub}
           />
        )}

        {activeView === 'MERCATO' && featureFlags.mercato && (
            <MercatoView 
                clubs={clubs}
                onTransfer={transferPlayer}
            />
        )}

        {activeView === 'SETTINGS' && (
            <SettingsView 
                featureFlags={featureFlags}
                setFeatureFlag={setFeatureFlag}
                apiConfig={apiConfig}
                setApiConfig={setApiConfig}
            />
        )}
      </main>
    </div>
  );
};

// --- Settings/Features Management View ---
const SettingsView: React.FC<{
    featureFlags: FeatureFlags;
    setFeatureFlag: (key: keyof FeatureFlags, value: boolean) => void;
    apiConfig: ApiConfig;
    setApiConfig: (config: ApiConfig) => void;
}> = ({ featureFlags, setFeatureFlag, apiConfig, setApiConfig }) => {
    
    const [localApiConfig, setLocalApiConfig] = useState(apiConfig);
    const [isSeeding, setIsSeeding] = useState(false);
    const [seedingMessage, setSeedingMessage] = useState('');

    const handleSaveApi = () => {
        setApiConfig(localApiConfig);
        alert('تم حفظ إعدادات الربط البرمجي والمفاتيح بنجاح!');
    };
    
    const handleSeedDatabase = async () => {
        if (!window.confirm("This will upload all local mock data to your Supabase tables. This is a one-time setup action. Continue?")) return;
    
        setIsSeeding(true);
        const supabase = getSupabase(apiConfig.supabaseUrl, apiConfig.supabaseKey);
        if (!supabase) {
            alert("Supabase is not configured!");
            setIsSeeding(false);
            return;
        }
    
        try {
            setSeedingMessage("Uploading clubs...");
            // Strip squad data before inserting into the 'clubs' table.
            const clubsToInsert = Object.values(CLUB_DATABASE)
                .filter(c => c.id !== 'generic')
                .map(({ squad, ...clubData }) => clubData);
            
            const { error: clubsError } = await supabase.from('clubs').upsert(clubsToInsert, { onConflict: 'id' });
            if (clubsError) throw clubsError;
    
            setSeedingMessage("Uploading articles...");
            // Remove sources property if it exists, as it's not in the DB schema
            const articlesToInsert = INITIAL_ARTICLES.map(({ sources, ...articleData }) => articleData);
            
            const { error: articlesError } = await supabase.from('articles').upsert(articlesToInsert, { onConflict: 'id' });
            if (articlesError) throw articlesError;
    
            setSeedingMessage("Seeding complete!");
            alert("Database seeded successfully! Please refresh the application to see the live data.");
        
        } catch (error: any) {
            const errorMessage = `Seeding failed: ${error.message}`;
            setSeedingMessage(errorMessage);
            alert(errorMessage);
        } finally {
            setIsSeeding(false);
        }
    };

    const featuresList: { key: keyof FeatureFlags; label: string; desc: string; icon: any }[] = [
        { key: 'clubs', label: 'أندية الخليج', desc: 'تفعيل لوحة معلومات الأندية، إدارة اللاعبين، وعرض صفحات الفرق.', icon: Shield },
        { key: 'matches', label: 'مركز المباريات', desc: 'عرض شريط المباريات المباشرة، النتائج، وجداول الترتيب.', icon: CheckCircle2 },
        { key: 'mercato', label: 'سوق الانتقالات', desc: 'نظام محاكاة شراء وبيع اللاعبين وتوليد أخبار الانتقالات.', icon: ArrowRightLeft },
        { key: 'videos', label: 'مكتبة الفيديو', desc: 'قسم خاص لعرض ملخصات المباريات والمحتوى المرئي.', icon: FilePlus },
        { key: 'analysis', label: 'التحليلات والمقالات', desc: 'قسم المقالات التحليلية الطويلة (بخلاف الأخبار العاجلة).', icon: Search },
        { key: 'autopilot', label: 'AI Auto-Pilot', desc: 'نظام الذكاء الاصطناعي لتوليد الأخبار تلقائياً.', icon: Wand2 },
    ];

    const apiKeysList = [
        { key: 'matches', label: 'مفتاح المباريات (API-Sports Dashboard)', desc: 'استخدم المفتاح من v3.football.api-sports.io (Direct Dashboard).', icon: Trophy },
        { key: 'results', label: 'مفتاح النتائج (Results)', desc: 'يستخدم لجلب النتائج المباشرة والأهداف أثناء المباراة.', icon: CheckCircle2 },
        { key: 'playersData', label: 'مفتاح بيانات اللاعبين (Players)', desc: 'لجلب تفاصيل اللاعبين، الصور، والطاقات للإحصائيات.', icon: User },
        { key: 'scouting', label: 'مفتاح البحث (Scouting)', desc: 'يستخدم في سوق الانتقالات للبحث عن لاعبين جدد.', icon: Users },
        { key: 'gemini', label: 'مفتاح الذكاء الاصطناعي (Gemini)', desc: 'مفتاح خاص لـ Google Gemini لتوليد المقالات والأخبار.', icon: Cpu },
    ];

    return (
        <div className="space-y-6">
            
            {/* 1. Feature Flags Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden animate-in fade-in duration-300">
                <div className="p-6 border-b border-slate-800 bg-slate-950">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Settings className="text-primary" /> إعدادات النظام والميزات
                    </h2>
                    <p className="text-slate-400 text-sm mt-2">
                        تحكم في الميزات النشطة في الموقع. يمكنك تعطيل الميزات المعقدة (مثل المباريات والأندية) والتركيز على نشر الأخبار فقط.
                    </p>
                </div>
                
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {featuresList.map((feature) => (
                            <div 
                                key={feature.key} 
                                className={`p-4 rounded-xl border transition-all ${featureFlags[feature.key] ? 'bg-slate-800 border-primary/50' : 'bg-slate-950 border-slate-800 opacity-60'}`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className={`p-2 rounded-lg ${featureFlags[feature.key] ? 'bg-primary/20 text-primary' : 'bg-slate-800 text-slate-500'}`}>
                                        <feature.icon size={20} />
                                    </div>
                                    <button 
                                        onClick={() => setFeatureFlag(feature.key, !featureFlags[feature.key])}
                                        className={`transition-colors ${featureFlags[feature.key] ? 'text-primary hover:text-white' : 'text-slate-500 hover:text-white'}`}
                                    >
                                        {featureFlags[feature.key] ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                                    </button>
                                </div>
                                <h3 className="text-white font-bold mb-1">{feature.label}</h3>
                                <p className="text-xs text-slate-400 leading-relaxed min-h-[40px]">{feature.desc}</p>
                                <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${featureFlags[feature.key] ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                                    <span className="text-[10px] font-bold text-slate-300 uppercase">
                                        {featureFlags[feature.key] ? 'نشط' : 'معطل'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 2. Supabase Configuration Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden animate-in fade-in duration-300">
                <div className="p-6 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Database className="text-green-500" /> Supabase Backend
                        </h2>
                        <p className="text-slate-400 text-sm mt-2">
                            قم بتوصيل التطبيق بقاعدة بيانات Supabase لتفعيل التخزين الدائم للبيانات والمصادقة.
                        </p>
                    </div>
                    {localApiConfig.supabaseUrl && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full">
                            <CheckCircle2 size={14} className="text-green-500" />
                            <span className="text-xs font-bold text-green-400">متصل</span>
                        </div>
                    )}
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-300 flex items-center gap-2">Supabase URL</label>
                        <input 
                            type="text"
                            value={localApiConfig.supabaseUrl}
                            onChange={e => setLocalApiConfig({...localApiConfig, supabaseUrl: e.target.value})}
                            placeholder="https://<project-id>.supabase.co"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-green-500 outline-none font-mono"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-300 flex items-center gap-2">Supabase Anon Key</label>
                        <input 
                            type="password"
                            value={localApiConfig.supabaseKey}
                            onChange={e => setLocalApiConfig({...localApiConfig, supabaseKey: e.target.value})}
                            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-green-500 outline-none font-mono"
                        />
                    </div>
                </div>
            </div>
            
            {/* 3. Database Actions Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden animate-in fade-in duration-300">
                <div className="p-6 border-b border-slate-800 bg-slate-950">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Database className="text-orange-500" /> Database Actions
                    </h2>
                    <p className="text-slate-400 text-sm mt-2">
                        Execute one-time actions to manage your database. Use with caution.
                    </p>
                </div>
                <div className="p-6 flex items-center gap-6">
                    <button 
                        onClick={handleSeedDatabase}
                        disabled={isSeeding || !apiConfig.supabaseUrl}
                        className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg shadow-orange-900/20 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed"
                    >
                        {isSeeding ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
                        {isSeeding ? seedingMessage : 'Seed Database with Initial Data'}
                    </button>
                    <div className="flex-1">
                        <p className="text-sm text-slate-400">
                            This will upload the built-in articles and clubs to your empty Supabase tables.
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            Only run this once after creating your tables. It uses 'upsert' so it's safe to run again if needed.
                        </p>
                    </div>
                </div>
            </div>

            {/* 4. API Configuration Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden animate-in fade-in duration-300">
                <div className="p-6 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Key className="text-yellow-500" /> مفاتيح API للمصادر الخارجية
                        </h2>
                        <p className="text-slate-400 text-sm mt-2">
                             إدارة مفاتيح الوصول للمصادر المختلفة (المباريات، النتائج، اللاعبين، والذكاء الاصطناعي).
                        </p>
                    </div>
                    {(Object.values(localApiConfig.keys) as string[]).some(k => k.length > 0) && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full">
                            <CheckCircle2 size={14} className="text-green-500" />
                            <span className="text-xs font-bold text-green-400">مفاتيح محفوظة</span>
                        </div>
                    )}
                </div>

                <div className="p-6 space-y-8">
                    
                    {/* General Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950 p-4 rounded-xl border border-slate-800">
                         {/* Provider Selection */}
                         <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-300">مزود البيانات الرياضية</label>
                            <select 
                                value={localApiConfig.provider}
                                onChange={e => setLocalApiConfig({...localApiConfig, provider: e.target.value as any})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                            >
                                <option value="api-football">API-Football (Direct Dashboard)</option>
                                <option value="sportmonks">SportMonks</option>
                                <option value="other">أخرى (Custom)</option>
                            </select>
                        </div>

                         {/* League IDs */}
                         <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-300">أرقام الدوريات (League IDs)</label>
                            <input 
                                type="text"
                                value={localApiConfig.leagueIds}
                                onChange={e => setLocalApiConfig({...localApiConfig, leagueIds: e.target.value})}
                                placeholder="مثال: 307, 308, 140"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none font-mono"
                            />
                        </div>
                    </div>

                    {/* API KEYS GRID */}
                    <div>
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
                            <Key size={18} className="text-yellow-500"/> إدارة المفاتيح (Granular Keys)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {apiKeysList.map((item) => (
                                <div key={item.key} className="space-y-2 group">
                                    <label className="text-xs font-bold text-slate-300 flex items-center gap-2 group-hover:text-primary transition-colors">
                                        <item.icon size={14} /> {item.label}
                                    </label>
                                    <div className="relative">
                                        <input 
                                            type="password"
                                            value={localApiConfig.keys[item.key as keyof typeof localApiConfig.keys]}
                                            onChange={e => setLocalApiConfig({
                                                ...localApiConfig, 
                                                keys: { ...localApiConfig.keys, [item.key]: e.target.value }
                                            })}
                                            placeholder={`أدخل ${item.label}...`}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 pl-10 text-white focus:border-primary outline-none font-mono text-sm transition-all focus:bg-slate-900"
                                        />
                                        <div className={`absolute left-3 top-3 w-2 h-2 rounded-full ${localApiConfig.keys[item.key as keyof typeof localApiConfig.keys] ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500'}`}></div>
                                    </div>
                                    <p className="text-[10px] text-slate-500">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800 flex justify-end gap-4 items-center">
                        <div className="flex items-center gap-3">
                             <div className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${localApiConfig.autoSync ? 'bg-blue-600' : 'bg-slate-700'}`} onClick={() => setLocalApiConfig({...localApiConfig, autoSync: !localApiConfig.autoSync})}>
                                 <div className={`w-4 h-4 bg-white rounded-full transition-transform ${localApiConfig.autoSync ? 'translate-x-4' : 'translate-x-0'}`}></div>
                             </div>
                             <span className="text-xs font-bold text-slate-400">تفعيل المزامنة التلقائية</span>
                        </div>
                        <button 
                            onClick={handleSaveApi}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/20"
                        >
                            <Save size={18} /> حفظ جميع الإعدادات
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MercatoView: React.FC<{
    clubs: ClubProfile[];
    onTransfer: (pid: string, sid: string, tid: string, price: number) => void;
}> = ({ clubs, onTransfer }) => {
    const [selectedClubId, setSelectedClubId] = useState<string>(clubs[0]?.id || '');
    const [searchQuery, setSearchQuery] = useState('');
    const [transferModal, setTransferModal] = useState<{player: Player, sourceClub: ClubProfile} | null>(null);
    const [targetClubId, setTargetClubId] = useState('');
    const [transferPrice, setTransferPrice] = useState(10);

    const activeClub = clubs.find(c => c.id === selectedClubId);
    
    // Flatten all players except from selected club for "Scouting"
    const otherPlayers = clubs
        .filter(c => c.id !== selectedClubId)
        .flatMap(c => c.squad.map(p => ({ ...p, clubId: c.id, clubName: c.name, clubLogo: c.logo })));
    
    const filteredPlayers = otherPlayers.filter(p => p.name.includes(searchQuery));

    const handleBuy = () => {
        if (!transferModal || !selectedClubId) return;
        
        // Target is the club BUYING (selectedClubId). 
        onTransfer(transferModal.player.id, transferModal.sourceClub.id, selectedClubId, transferPrice);
        setTransferModal(null);
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden min-h-[600px] flex flex-col">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                <div className="flex items-center gap-3">
                    <ArrowRightLeft className="text-primary" />
                    <h2 className="font-bold text-white text-lg">سوق الانتقالات العالمي</h2>
                </div>
                
                <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-xs font-bold">إدارة فريق:</span>
                    <select 
                        value={selectedClubId}
                        onChange={e => setSelectedClubId(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-white rounded p-2 text-sm outline-none focus:border-primary"
                    >
                        {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="p-6 flex-1 flex flex-col">
                {/* Search Bar */}
                <div className="relative mb-6">
                    <Search className="absolute right-3 top-3 text-slate-500" size={20} />
                    <input 
                        type="text"
                        placeholder="ابحث عن لاعب لضمه للفريق..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pr-10 text-white focus:border-primary outline-none"
                    />
                </div>

                {/* Results Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-[600px] pr-2">
                    {filteredPlayers.map(player => (
                        <div key={player.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center gap-4 hover:border-slate-600 transition-colors group relative">
                            <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 overflow-hidden shrink-0">
                                {player.image ? <img src={player.image} className="w-full h-full object-cover" /> : <User className="w-full h-full p-3 text-slate-600"/>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-white truncate">{player.name}</h3>
                                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                                    <img src={player.clubLogo} className="w-4 h-4 object-contain" />
                                    <span>{player.clubName}</span>
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <span className="text-[10px] bg-slate-900 border border-slate-700 px-1 rounded text-primary font-mono">{player.position}</span>
                                    <span className="text-[10px] bg-slate-900 border border-slate-700 px-1 rounded text-yellow-500 font-mono">Rating: {player.rating}</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setTransferModal({ 
                                    player: player, 
                                    sourceClub: clubs.find(c => c.id === player.clubId)! 
                                })}
                                className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 bg-primary text-slate-900 px-3 py-1 rounded text-xs font-bold transition-all shadow-lg hover:scale-105"
                            >
                                شراء
                            </button>
                        </div>
                    ))}
                    {filteredPlayers.length === 0 && (
                        <div className="col-span-full text-center py-10 text-slate-500">لا توجد نتائج بحث</div>
                    )}
                </div>
            </div>

            {/* Transfer Modal */}
            {transferModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="p-6 text-center border-b border-slate-800 bg-gradient-to-b from-slate-800 to-slate-900">
                             <h3 className="text-xl font-black text-white mb-1">عقد انتقال</h3>
                             <p className="text-sm text-slate-400">إتمام الصفقة رسمياً</p>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div className="flex items-center justify-between px-4">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-16 h-16 rounded-full bg-slate-950 border-2 border-slate-700 overflow-hidden p-2">
                                         <img src={transferModal.sourceClub.logo} className="w-full h-full object-contain opacity-50 grayscale" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-500 line-through">{transferModal.sourceClub.name}</span>
                                </div>
                                <ArrowRightLeft className="text-primary animate-pulse" size={24} />
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-16 h-16 rounded-full bg-slate-950 border-2 border-primary overflow-hidden p-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                         <img src={activeClub?.logo} className="w-full h-full object-contain" />
                                    </div>
                                    <span className="text-xs font-bold text-white">{activeClub?.name}</span>
                                </div>
                            </div>

                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-900">
                                    <img src={transferModal.player.image || ''} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">{transferModal.player.name}</h4>
                                    <span className="text-xs text-slate-500">{transferModal.player.position} • {transferModal.player.rating} OVR</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400">قيمة الصفقة (مليون يورو)</label>
                                <input 
                                    type="number" 
                                    value={transferPrice}
                                    onChange={e => setTransferPrice(Number(e.target.value))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white font-mono text-lg focus:border-primary outline-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button 
                                    onClick={() => setTransferModal(null)}
                                    className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-400 font-bold hover:bg-slate-700 transition-colors"
                                >
                                    إلغاء
                                </button>
                                <button 
                                    onClick={handleBuy}
                                    className="flex-1 py-3 rounded-xl bg-primary text-slate-900 font-black hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 size={18} /> توقيع العقد
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ClubsManagerView: React.FC<{
  clubs: ClubProfile[];
  onAdd: (c: ClubProfile) => Promise<boolean>;
  onUpdate: (c: ClubProfile) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}> = ({ clubs, onAdd, onUpdate, onDelete }) => {
  const [editingClub, setEditingClub] = useState<Partial<ClubProfile> | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Player Edit State
  const [editingPlayer, setEditingPlayer] = useState<Partial<Player> | null>(null);
  const [isPlayerFormOpen, setIsPlayerFormOpen] = useState(false);

  const handleEdit = (club: ClubProfile) => {
    setEditingClub(JSON.parse(JSON.stringify(club))); // Deep copy
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingClub({
      id: '',
      name: '',
      englishName: '',
      logo: '',
      country: Category.SAUDI,
      founded: new Date().getFullYear(),
      colors: { primary: '#10b981', secondary: '#0f172a', text: '#ffffff' },
      stadium: '',
      coach: '',
      fanCount: 1000,
      squad: [],
      trophies: []
    });
    setIsFormOpen(true);
  };

  const handleSaveClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClub) return;
    setIsSaving(true);
    
    try {
        const clubToSave = { ...editingClub };
        const isNew = !clubToSave.id;
        if (isNew) {
            clubToSave.id = clubToSave.englishName?.toLowerCase().replace(/\s/g, '-') || Date.now().toString();
        }

        const success = isNew
            ? await onAdd(clubToSave as ClubProfile)
            : await onUpdate(clubToSave as ClubProfile);

        if (success) {
            alert(`تم حفظ النادي "${clubToSave.name}" بنجاح!`);
            setIsFormOpen(false);
            setEditingClub(null);
        }
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeleteClub = async (club: ClubProfile) => {
    if (window.confirm(`هل أنت متأكد من حذف نادي ${club.name}؟ لا يمكن التراجع عن هذا الإجراء.`)) {
        const success = await onDelete(club.id);
        if (success) {
            alert("تم حذف النادي بنجاح.");
        }
    }
  };

  // --- Player Management Logic ---
  const handleAddPlayer = () => {
     setEditingPlayer({
        id: Date.now().toString(),
        name: '',
        number: 0,
        position: 'MID',
        rating: 75,
        stats: { pac: 70, sho: 70, pas: 70, dri: 70, def: 50, phy: 60 },
        image: ''
     });
     setIsPlayerFormOpen(true);
  };

  const handleEditPlayer = (player: Player) => {
     setEditingPlayer({ ...player });
     setIsPlayerFormOpen(true);
  };

  const handleSavePlayer = () => {
     if (!editingPlayer || !editingClub) return;
     
     const newSquad = [...(editingClub.squad || [])];
     const existingIndex = newSquad.findIndex(p => p.id === editingPlayer.id);

     if (existingIndex >= 0) {
        newSquad[existingIndex] = editingPlayer as Player;
     } else {
        newSquad.push(editingPlayer as Player);
     }

     setEditingClub({ ...editingClub, squad: newSquad });
     setIsPlayerFormOpen(false);
     setEditingPlayer(null);
  };

  const handleDeletePlayer = (playerId: string) => {
      if (!editingClub) return;
      const newSquad = editingClub.squad?.filter(p => p.id !== playerId) || [];
      setEditingClub({ ...editingClub, squad: newSquad });
  };

  const generateAIAvatar = () => {
      if (!editingPlayer) return;
      // Using DiceBear Avataaars for high quality, legal avatars
      const seed = editingPlayer.name ? editingPlayer.name.replace(/\s/g, '') : Math.random().toString(36);
      const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&gender=male&style=circle`;
      setEditingPlayer({ ...editingPlayer, image: avatarUrl });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden animate-in fade-in duration-300">
      
      {!isFormOpen ? (
        // LIST VIEW
        <>
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                <h2 className="font-bold text-white flex items-center gap-2">
                <Shield className="text-primary" /> إدارة الأندية
                </h2>
                <button 
                onClick={handleAddNew}
                className="bg-primary text-slate-900 px-4 py-2 rounded-lg font-bold text-sm hover:bg-emerald-400 transition-colors flex items-center gap-2"
                >
                <FilePlus size={16} /> إضافة نادي
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-right">
                <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-bold">
                    <tr>
                    <th className="px-6 py-4">النادي</th>
                    <th className="px-6 py-4">الدولة</th>
                    <th className="px-6 py-4">المدرب</th>
                    <th className="px-6 py-4">الإجراءات</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                    {clubs.map(club => (
                    <tr key={club.id} className="hover:bg-slate-800/50">
                        <td className="px-6 py-4 flex items-center gap-3">
                            <TeamLogo src={club.logo} alt={club.name} className="w-8 h-8" />
                            <span className="font-bold text-white">{club.name}</span>
                        </td>
                        <td className="px-6 py-4"><span className="bg-slate-800 px-2 py-1 rounded text-xs">{club.country}</span></td>
                        <td className="px-6 py-4">{club.coach}</td>
                        <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleEdit(club)} className="p-2 hover:bg-primary/20 hover:text-primary rounded-lg transition-colors">
                            <Edit size={16} />
                            </button>
                            <button onClick={() => handleDeleteClub(club)} className="p-2 hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-colors">
                            <Trash2 size={16} />
                            </button>
                        </div>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
        </>
      ) : (
        // EDIT FORM
        <div className="p-6">
           <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white">
                 {editingClub?.id ? `تعديل: ${editingClub.name}` : 'إضافة نادي جديد'}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-white">
                  <X size={24} />
              </button>
           </div>

           <form onSubmit={handleSaveClub} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400">اسم النادي (عربي)</label>
                    <input 
                      type="text" 
                      value={editingClub?.name}
                      onChange={e => setEditingClub({...editingClub, name: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-primary outline-none"
                      required
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400">الاسم (إنجليزي - للرابط)</label>
                    <input 
                      type="text" 
                      value={editingClub?.englishName}
                      onChange={e => setEditingClub({...editingClub, englishName: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-primary outline-none"
                      required
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400">رابط الشعار</label>
                    <div className="flex gap-2">
                        <input 
                        type="text" 
                        value={editingClub?.logo}
                        onChange={e => setEditingClub({...editingClub, logo: e.target.value})}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-primary outline-none"
                        />
                        <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700">
                             {editingClub?.logo ? <img src={editingClub.logo} className="w-8 h-8 object-contain" /> : <Shield size={20} className="text-slate-600"/>}
                        </div>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400">رابط الغلاف</label>
                    <input 
                        type="text" 
                        value={editingClub?.coverImage}
                        onChange={e => setEditingClub({...editingClub, coverImage: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-primary outline-none"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400">الدولة</label>
                    <select 
                       value={editingClub?.country}
                       onChange={e => setEditingClub({...editingClub, country: e.target.value as Category})}
                       className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-primary outline-none"
                    >
                        {Object.values(Category).slice(0, 6).map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400">المدرب</label>
                    <input 
                      type="text" 
                      value={editingClub?.coach}
                      onChange={e => setEditingClub({...editingClub, coach: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-primary outline-none"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400">اللون الأساسي (Hex)</label>
                    <div className="flex items-center gap-2">
                        <input 
                        type="color" 
                        value={editingClub?.colors?.primary}
                        onChange={e => setEditingClub({
                            ...editingClub, 
                            colors: { ...editingClub.colors!, primary: e.target.value }
                        })}
                        className="h-10 w-10 rounded overflow-hidden cursor-pointer border-none p-0"
                        />
                        <input 
                        type="text" 
                        value={editingClub?.colors?.primary}
                        onChange={e => setEditingClub({
                            ...editingClub, 
                            colors: { ...editingClub.colors!, primary: e.target.value }
                        })}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-white font-mono"
                        />
                    </div>
                 </div>
              </div>

              {/* SQUAD MANAGEMENT SECTION */}
              <div className="border-t border-slate-800 pt-6 mt-6">
                 <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-white text-lg">قائمة اللاعبين (Squad)</h3>
                    <button 
                       type="button"
                       onClick={handleAddPlayer}
                       className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <User size={14} /> إضافة لاعب
                    </button>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                     {editingClub?.squad?.map((player, idx) => (
                         <div key={idx} className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-center gap-3 group hover:border-primary/50 transition-colors">
                             <div className="w-10 h-10 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                                 {player.image ? (
                                     <img src={player.image} alt={player.name} className="w-full h-full object-cover" />
                                 ) : (
                                     <User className="w-full h-full p-2 text-slate-600" />
                                 )}
                             </div>
                             <div className="flex-1 min-w-0">
                                 <div className="font-bold text-white text-sm truncate">{player.name}</div>
                                 <div className="text-[10px] text-slate-500 flex gap-2">
                                     <span className="font-mono bg-slate-900 px-1 rounded">{player.position}</span>
                                     <span className="font-mono text-primary">RAT: {player.rating}</span>
                                 </div>
                             </div>
                             <div className="flex gap-1">
                                 <button type="button" onClick={() => handleEditPlayer(player)} className="p-1.5 hover:bg-primary/20 hover:text-primary rounded text-slate-500"><Edit size={14}/></button>
                                 <button type="button" onClick={() => handleDeletePlayer(player.id)} className="p-1.5 hover:bg-red-500/20 hover:text-red-500 rounded text-slate-500"><Trash2 size={14}/></button>
                             </div>
                         </div>
                     ))}
                 </div>
              </div>

              <div className="pt-6 border-t border-slate-800 flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-6 py-2 rounded-lg text-slate-400 hover:bg-slate-800 transition-colors font-bold"
                  >
                      إلغاء
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2 rounded-lg bg-primary text-slate-900 hover:bg-emerald-400 transition-colors font-bold flex items-center gap-2 disabled:bg-slate-700 disabled:text-slate-500"
                  >
                      {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                      {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                  </button>
              </div>
           </form>

           {/* PLAYER EDITOR MODAL */}
           {isPlayerFormOpen && (
               <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                   <div className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95">
                       <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                           <h3 className="font-bold text-white">تعديل بيانات اللاعب</h3>
                           <button onClick={() => setIsPlayerFormOpen(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
                       </div>
                       <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                           
                           {/* Main Details */}
                           <div className="flex gap-4">
                               <div className="w-24 h-24 bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center relative group overflow-hidden">
                                   {editingPlayer?.image ? (
                                       <img src={editingPlayer.image} className="w-full h-full object-cover" />
                                   ) : (
                                       <User size={32} className="text-slate-600" />
                                   )}
                                   <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                       <button type="button" onClick={generateAIAvatar} className="text-xs text-white flex flex-col items-center gap-1">
                                           <Wand2 size={16} /> AI توليد
                                       </button>
                                   </div>
                               </div>
                               <div className="flex-1 space-y-3">
                                   <input 
                                       placeholder="اسم اللاعب"
                                       value={editingPlayer?.name}
                                       onChange={e => setEditingPlayer({...editingPlayer, name: e.target.value})}
                                       className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-sm"
                                   />
                                   <div className="flex gap-2">
                                       <input 
                                           placeholder="#"
                                           type="number"
                                           value={editingPlayer?.number}
                                           onChange={e => setEditingPlayer({...editingPlayer, number: parseInt(e.target.value)})}
                                           className="w-16 bg-slate-950 border border-slate-800 rounded p-2 text-white text-sm text-center"
                                       />
                                       <select
                                            value={editingPlayer?.position}
                                            onChange={e => setEditingPlayer({...editingPlayer, position: e.target.value as any})}
                                            className="flex-1 bg-slate-950 border border-slate-800 rounded p-2 text-white text-sm"
                                       >
                                           {['GK', 'DEF', 'CB', 'LB', 'RB', 'MID', 'CM', 'CDM', 'CAM', 'FWD', 'RW', 'LW', 'ST'].map(p => (
                                               <option key={p} value={p}>{p}</option>
                                           ))}
                                       </select>
                                   </div>
                               </div>
                           </div>

                           {/* Stats Grid */}
                           <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                               <div className="flex justify-between items-center mb-4">
                                   <span className="text-xs font-bold text-slate-400">إحصائيات البطاقة</span>
                                   <div className="flex items-center gap-2">
                                       <span className="text-xs text-slate-500">التقييم العام</span>
                                       <input 
                                           type="number"
                                           value={editingPlayer?.rating}
                                           onChange={e => setEditingPlayer({...editingPlayer, rating: parseInt(e.target.value)})}
                                           className="w-14 bg-slate-800 border border-slate-700 rounded p-1 text-center text-primary font-bold"
                                       />
                                   </div>
                               </div>
                               <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                   {(['pac', 'sho', 'pas', 'dri', 'def', 'phy'] as const).map(stat => (
                                       <div key={stat} className="flex items-center justify-between">
                                           <label className="text-xs font-bold text-slate-500 uppercase">{stat}</label>
                                           <div className="flex items-center gap-2 flex-1 mx-2">
                                              <input 
                                                type="range" min="0" max="99" 
                                                value={editingPlayer?.stats?.[stat] || 50}
                                                onChange={e => setEditingPlayer({
                                                    ...editingPlayer, 
                                                    stats: { ...editingPlayer.stats!, [stat]: parseInt(e.target.value) }
                                                })}
                                                className="flex-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                                              />
                                              <span className="text-xs font-mono w-6 text-right text-white">{editingPlayer?.stats?.[stat]}</span>
                                           </div>
                                       </div>
                                   ))}
                               </div>
                           </div>
                           
                           <button 
                               type="button" 
                               onClick={generateAIAvatar}
                               className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-600/30 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all"
                           >
                               <Wand2 size={14} /> توليد صورة رمزية قانونية (AI Avatar)
                           </button>

                       </div>
                       <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-2">
                           <button onClick={() => setIsPlayerFormOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white">إلغاء</button>
                           <button onClick={handleSavePlayer} className="px-4 py-2 bg-primary text-slate-900 rounded-lg text-xs font-bold hover:bg-emerald-400">حفظ اللاعب</button>
                       </div>
                   </div>
               </div>
           )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;