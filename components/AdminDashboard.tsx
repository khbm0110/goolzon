// FIX: Removed reference to "vite/client" which was causing a resolution error.

import React, { useState, useEffect } from 'react';
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
  X,
  User,
  Save,
  Wand2,
  Search,
  CheckCircle2,
  Settings,
  ToggleLeft,
  ToggleRight,
  Key,
  Cpu,
  Users,
  Loader2,
  Eye,
  Link as LinkIcon,
  Activity,
  RefreshCw,
  BarChart2,
  Handshake
} from 'lucide-react';
import { Article, Category, ClubProfile, Player, FeatureFlags, ApiConfig, Sponsor } from '../types';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';
import TeamLogo from './TeamLogo';
import ArticleEditor from './ArticleEditor';
import { Link } from 'react-router-dom';

// --- Reusable Hook for Local Storage ---
const useLocalStorage = <T,>(key: string, initialValue: T): [T, (value: T) => void] => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.log(error);
            return initialValue;
        }
    });

    const setValue = (value: T) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.log(error);
        }
    };

    return [storedValue, setValue];
};


// --- Dashboard View Components ---
const StatCard: React.FC<{ icon: React.ElementType, title: string, value: string | number, color: string }> = ({ icon: Icon, title, value, color }) => (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-start justify-between">
        <div>
            <p className="text-sm text-slate-400 font-bold mb-1">{title}</p>
            <p className="text-3xl font-black text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-lg bg-${color}/10 text-${color}`}>
            <Icon size={24} />
        </div>
    </div>
);

const DashboardView: React.FC<{
    onNavigate: (view: any) => void;
    onEditArticle: (article: Article) => void;
}> = ({ onNavigate, onEditArticle }) => {
    const { articles, clubs } = useData();
    const totalPlayers = clubs.reduce((sum, club) => sum + (club.squad?.length || 0), 0);
    const totalViews = articles.reduce((sum, article) => sum + article.views, 0);

    return (
        <div className="animate-in fade-in duration-300 space-y-8">
            <div>
                <h1 className="text-3xl font-black text-white mb-2">لوحة القيادة</h1>
                <p className="text-slate-400">نظرة عامة على أداء موقعك.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={FilePlus} title="إجمالي المقالات" value={articles.length} color="primary" />
                <StatCard icon={Eye} title="إجمالي المشاهدات" value={totalViews.toLocaleString()} color="blue-500" />
                <StatCard icon={Shield} title="الأندية المسجلة" value={clubs.length} color="amber-500" />
                <StatCard icon={Users} title="إجمالي اللاعبين" value={totalPlayers} color="indigo-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl">
                    <div className="p-4 border-b border-slate-800">
                        <h3 className="font-bold text-white flex items-center gap-2"><Activity size={18}/>آخر النشاطات</h3>
                    </div>
                    <div className="divide-y divide-slate-800">
                        {articles.slice(0, 5).map(article => (
                            <div key={article.id} className="p-4 flex justify-between items-center hover:bg-slate-800/50">
                                <div>
                                    <span className="text-xs bg-slate-800 px-2 py-1 rounded text-primary">{article.category}</span>
                                    <p className="font-bold text-slate-200 mt-1">{article.title}</p>
                                    <p className="text-xs text-slate-500">{article.author} • {new Date(article.date).toLocaleDateString('ar-SA')}</p>
                                </div>
                                <button onClick={() => onEditArticle(article)} className="p-2 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                                    <Edit size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                         <h3 className="font-bold text-white mb-4">إجراءات سريعة</h3>
                         <div className="space-y-3">
                             <button onClick={() => onNavigate('EDITOR')} className="w-full flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-left text-white font-bold transition-colors">
                                <FilePlus className="text-primary"/> إضافة مقال جديد
                             </button>
                             <button onClick={() => onNavigate('CLUBS')} className="w-full flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-left text-white font-bold transition-colors">
                                <Shield className="text-amber-500"/> إدارة الأندية
                             </button>
                             <Link to="/" target="_blank" className="w-full flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-left text-white font-bold transition-colors">
                                <LinkIcon className="text-indigo-500"/> عرض الموقع المباشر
                             </Link>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- SEO View ---
interface SeoSettings {
    title: string;
    description: string;
    keywords: string;
}
const SEOView: React.FC = () => {
    const [settings, setSettings] = useLocalStorage<SeoSettings>('goolzon_seo_settings', {
        title: 'goolzon | الكرة الخليجية',
        description: 'المصدر الأول لأخبار الرياضة الخليجية. تغطية شاملة للدوري السعودي، الإماراتي، القطري، الكويتي، العماني، والبحريني مع نتائج مباشرة وتحليلات وفيديو.',
        keywords: 'كرة قدم, الخليج, السعودية, الإمارات, قطر, الكويت, عمان, البحرين, رياضة'
    });
     const [localSettings, setLocalSettings] = useState(settings);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setSettings(localSettings);
        alert('تم حفظ إعدادات SEO بنجاح!');
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden animate-in fade-in duration-300">
            <div className="p-6 border-b border-slate-800 bg-slate-950">
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><Globe className="text-primary" /> إعدادات SEO</h2>
                <p className="text-slate-400 text-sm mt-2">تحكم في كيفية ظهور موقعك في محركات البحث مثل جوجل.</p>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300">عنوان الموقع (Title Tag)</label>
                    <input value={localSettings.title} onChange={e => setLocalSettings({...localSettings, title: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-primary outline-none" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300">الوصف التعريفي (Meta Description)</label>
                    <textarea value={localSettings.description} onChange={e => setLocalSettings({...localSettings, description: e.target.value})} rows={4} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-primary outline-none" />
                </div>
                 <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300">الكلمات المفتاحية (Meta Keywords)</label>
                    <input value={localSettings.keywords} onChange={e => setLocalSettings({...localSettings, keywords: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-primary outline-none" placeholder="كلمة, أخرى, فاصلة" />
                </div>
                <div className="pt-6 border-t border-slate-800 flex justify-end">
                    <button type="submit" className="px-8 py-3 rounded-xl bg-primary text-slate-900 font-black hover:bg-emerald-400 transition-colors flex items-center gap-2">
                        <Save size={18} /> حفظ الإعدادات
                    </button>
                </div>
            </form>
        </div>
    );
};

// --- Ads View ---
interface AdSettings {
    enabled: boolean;
    headerCode: string;
    articleCode: string;
    sidebarCode: string;
}
const AdsView: React.FC = () => {
    const [settings, setSettings] = useLocalStorage<AdSettings>('goolzon_ad_settings', {
        enabled: false, headerCode: '', articleCode: '', sidebarCode: ''
    });
    const [localSettings, setLocalSettings] = useState(settings);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setSettings(localSettings);
        alert('تم حفظ إعدادات الإعلانات بنجاح!');
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden animate-in fade-in duration-300">
            <div className="p-6 border-b border-slate-800 bg-slate-950">
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><DollarSign className="text-primary" /> إدارة الإعلانات</h2>
                <p className="text-slate-400 text-sm mt-2">ضع أكواد الإعلانات من منصتك (مثل Google AdSense) هنا.</p>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-6">
                <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <button type="button" onClick={() => setLocalSettings({...localSettings, enabled: !localSettings.enabled})} className={`transition-colors ${localSettings.enabled ? 'text-primary' : 'text-slate-500'}`}>
                        {localSettings.enabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                    </button>
                    <div>
                        <h3 className="font-bold text-white">الحالة العامة للإعلانات</h3>
                        <p className="text-xs text-slate-400">
                            {localSettings.enabled ? 'الإعلانات مفعلة وستظهر في الموقع.' : 'الإعلانات معطلة حالياً.'}
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300">كود بانر الهيدر (728x90)</label>
                    <textarea value={localSettings.headerCode} onChange={e => setLocalSettings({...localSettings, headerCode: e.target.value})} rows={4} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-primary outline-none font-mono" placeholder="<script>...</script>" />
                </div>
                 <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300">كود إعلان داخل المقال (Responsive)</label>
                    <textarea value={localSettings.articleCode} onChange={e => setLocalSettings({...localSettings, articleCode: e.target.value})} rows={4} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-primary outline-none font-mono" placeholder="<ins>...</ins>" />
                </div>
                 <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300">كود إعلان الشريط الجانبي (300x250)</label>
                    <textarea value={localSettings.sidebarCode} onChange={e => setLocalSettings({...localSettings, sidebarCode: e.target.value})} rows={4} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-primary outline-none font-mono" />
                </div>

                <div className="pt-6 border-t border-slate-800 flex justify-end">
                    <button type="submit" className="px-8 py-3 rounded-xl bg-primary text-slate-900 font-black hover:bg-emerald-400 transition-colors flex items-center gap-2">
                        <Save size={18} /> حفظ الإعدادات
                    </button>
                </div>
            </form>
        </div>
    );
};

const SponsorsView: React.FC = () => {
    const { sponsors, addSponsor, deleteSponsor } = useData();
    const [newSponsor, setNewSponsor] = useState<Partial<Sponsor>>({ name: '', logo: '', url: '', active: true });

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!newSponsor.name || !newSponsor.logo) return;
        
        await addSponsor({
            id: Date.now().toString(),
            name: newSponsor.name,
            logo: newSponsor.logo,
            url: newSponsor.url || '#',
            active: true
        });
        setNewSponsor({ name: '', logo: '', url: '', active: true });
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden animate-in fade-in duration-300">
             <div className="p-6 border-b border-slate-800 bg-slate-950">
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><Handshake className="text-primary" /> إدارة الرعاة (Sponsors)</h2>
                <p className="text-slate-400 text-sm mt-2">أضف شعارات الشركات الراعية لتظهر في أسفل الموقع.</p>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Form */}
                <form onSubmit={handleAdd} className="space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-800 h-fit">
                    <h3 className="font-bold text-white">إضافة راعي جديد</h3>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400">اسم الشركة</label>
                        <input value={newSponsor.name} onChange={e => setNewSponsor({...newSponsor, name: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" placeholder="مثال: طيران الإمارات" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400">رابط الشعار (URL)</label>
                        <div className="flex gap-2">
                             <input value={newSponsor.logo} onChange={e => setNewSponsor({...newSponsor, logo: e.target.value})} className="flex-1 bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" placeholder="https://..." required />
                             {newSponsor.logo && <div className="w-10 h-10 bg-white rounded flex items-center justify-center"><img src={newSponsor.logo} className="h-8 w-8 object-contain"/></div>}
                        </div>
                    </div>
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400">رابط الموقع (اختياري)</label>
                        <input value={newSponsor.url} onChange={e => setNewSponsor({...newSponsor, url: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" placeholder="https://..." />
                    </div>
                    <button type="submit" className="w-full bg-primary text-slate-900 font-bold py-2 rounded hover:bg-emerald-400 transition-colors">إضافة</button>
                </form>

                {/* List */}
                <div className="space-y-3">
                     <h3 className="font-bold text-white">الرعاة الحاليين</h3>
                     {sponsors.length === 0 && <p className="text-slate-500 text-sm">لا يوجد رعاة حالياً.</p>}
                     {sponsors.map(sponsor => (
                         <div key={sponsor.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700">
                             <div className="flex items-center gap-3">
                                 <div className="w-12 h-12 bg-white rounded flex items-center justify-center p-1">
                                     <img src={sponsor.logo} alt={sponsor.name} className="w-full h-full object-contain" />
                                 </div>
                                 <div>
                                     <p className="font-bold text-white text-sm">{sponsor.name}</p>
                                     <a href={sponsor.url} target="_blank" className="text-xs text-primary hover:underline truncate max-w-[150px] block">{sponsor.url}</a>
                                 </div>
                             </div>
                             <button onClick={() => deleteSponsor(sponsor.id)} className="p-2 text-slate-500 hover:text-red-500 bg-slate-900 hover:bg-red-500/10 rounded-lg transition-colors">
                                 <Trash2 size={16} />
                             </button>
                         </div>
                     ))}
                </div>
            </div>
        </div>
    );
};

// --- Main Admin Dashboard Component ---

const ContentListView: React.FC<{
    articles: Article[];
    onEdit: (article: Article) => void;
    onDelete: (id: string) => void;
}> = ({ articles, onEdit, onDelete }) => {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden animate-in fade-in duration-300">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                <h2 className="font-bold text-white flex items-center gap-2">
                    <List className="text-primary" /> إدارة المحتوى
                </h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-right">
                    <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-bold">
                        <tr>
                            <th className="px-6 py-4">العنوان</th>
                            <th className="px-6 py-4">القسم</th>
                            <th className="px-6 py-4">المؤلف</th>
                            <th className="px-6 py-4">التاريخ</th>
                            <th className="px-6 py-4">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                        {articles.map(article => (
                            <tr key={article.id} className="hover:bg-slate-800/50">
                                <td className="px-6 py-4 font-bold text-white max-w-sm truncate">{article.title}</td>
                                <td className="px-6 py-4"><span className="bg-slate-800 px-2 py-1 rounded text-xs">{article.category}</span></td>
                                <td className="px-6 py-4">{article.author}</td>
                                <td className="px-6 py-4 text-slate-500 font-mono text-xs">{new Date(article.date).toLocaleDateString('ar-SA')}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => onEdit(article)} className="p-2 hover:bg-primary/20 hover:text-primary rounded-lg transition-colors">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => onDelete(article.id)} className="p-2 hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const AdminDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<'DASHBOARD' | 'EDITOR' | 'LIST' | 'SEO' | 'ADS' | 'CLUBS' | 'SETTINGS' | 'SPONSORS'>('DASHBOARD');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { 
    clubs, addClub, updateClub, deleteClub, articles, addArticle, updateArticle, deleteArticle, matches
  } = useData();
  const { 
    featureFlags, setFeatureFlag
  } = useSettings();
  
  const [editorData, setEditorData] = useState<Partial<Article>>({});
  const [editorMode, setEditorMode] = useState<'NEW' | 'EDIT'>('NEW');

  const handleEditClick = (article: Article) => {
    setEditorData(article);
    setEditorMode('EDIT');
    setActiveView('EDITOR');
  };
  
  const handleDeleteArticle = async (id: string) => {
      if (window.confirm('هل أنت متأكد من حذف هذا المقال؟')) {
          await deleteArticle(id);
      }
  };

  const handleNewClick = () => {
    setEditorData({
      title: '', summary: '', content: '', imageUrl: '',
      category: Category.SAUDI, author: 'محرر goolzon', videoEmbedId: ''
    });
    setEditorMode('NEW');
    setActiveView('EDITOR');
  };

  const handleSaveArticle = async (articleData: Article) => {
    let success = false;
    if (editorMode === 'NEW') {
        const newArticle: Article = {
            ...articleData,
            id: `usr-${Date.now()}`, date: new Date().toISOString(),
            views: 0, isBreaking: articleData.isBreaking || false,
            author: articleData.author || 'محرر goolzon',
        };
        success = await addArticle(newArticle);
    } else {
        success = await updateArticle(articleData);
    }

    if (success) {
        alert('تم حفظ المقال بنجاح!');
        setActiveView('LIST');
    }
  };

  const navItems = [
    { id: 'DASHBOARD', label: 'لوحة القيادة', icon: LayoutDashboard },
    { id: 'EDITOR', label: 'إضافة مقال', icon: FilePlus },
    { id: 'LIST', label: 'إدارة المحتوى', icon: List },
    { id: 'CLUBS', label: 'إدارة الأندية', icon: Shield, hidden: !featureFlags.clubs },
    { id: 'SEO', label: 'إعدادات SEO', icon: Globe },
    { id: 'ADS', label: 'إدارة الإعلانات', icon: DollarSign },
    { id: 'SPONSORS', label: 'الرعاة', icon: Handshake },
    { id: 'SETTINGS', label: 'الإعدادات والميزات', icon: Settings },
  ].filter(item => !item.hidden);

  return (
    <div className="flex min-h-screen bg-slate-950">
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
           {isSidebarOpen && <div className="text-xs text-slate-600 text-center">goolzon CMS v1.3</div>}
        </div>
      </aside>

      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'mr-64' : 'mr-20'} p-6`}>
        {activeView === 'DASHBOARD' && <DashboardView onNavigate={setActiveView} onEditArticle={handleEditClick} />}
        {activeView === 'EDITOR' && (
            <ArticleEditor 
                initialData={editorData}
                onSave={handleSaveArticle}
                onCancel={() => setActiveView('LIST')}
                mode={editorMode}
                matches={matches}
            />
        )}
        {activeView === 'LIST' && (
            <ContentListView 
                articles={articles} 
                onEdit={handleEditClick} 
                onDelete={handleDeleteArticle} 
            />
        )}
         {activeView === 'SEO' && <SEOView />}
         {activeView === 'ADS' && <AdsView />}
         {activeView === 'SPONSORS' && <SponsorsView />}
        
        {activeView === 'CLUBS' && featureFlags.clubs && (
           <ClubsManagerView 
              clubs={clubs}
              onAdd={addClub}
              onUpdate={updateClub}
              onDelete={deleteClub}
           />
        )}

        {activeView === 'SETTINGS' && (
            <SettingsView 
                featureFlags={featureFlags}
                setFeatureFlag={setFeatureFlag}
            />
        )}
      </main>
    </div>
  );
};

const SettingsView: React.FC<{
    featureFlags: FeatureFlags;
    setFeatureFlag: (key: keyof FeatureFlags, value: boolean) => void;
}> = ({ featureFlags, setFeatureFlag }) => {
    
    // Squad Sync State
    const [isSyncingSquads, setIsSyncingSquads] = useState(false);
    const [squadsSyncMessage, setSquadsSyncMessage] = useState('');

    // Performance Sync State
    const [isSyncingPerformance, setIsSyncingPerformance] = useState(false);
    const [performanceSyncMessage, setPerformanceSyncMessage] = useState('');
    
    const inWindow = isWithinTransferWindow();

    const handleManualSync = async (type: 'squads' | 'performance') => {
        const setSyncing = type === 'squads' ? setIsSyncingSquads : setIsSyncingPerformance;
        const setMessage = type === 'squads' ? setSquadsSyncMessage : setPerformanceSyncMessage;
        const endpoint = type === 'squads' ? '/api/sync-squads' : '/api/sync-performance';

        setSyncing(true);
        setMessage('');
        try {
            const response = await fetch(endpoint);
            const data = await response.json();
            if (response.ok) {
                setMessage(data.message || 'تمت المزامنة بنجاح!');
            } else {
                throw new Error(data.error || 'فشل في المزامنة');
            }
        } catch (error: any) {
            setMessage(`خطأ: ${error.message}`);
        } finally {
            setSyncing(false);
            setTimeout(() => setMessage(''), 5000);
        }
    };
    
    const featuresList: { key: keyof FeatureFlags; label: string; desc: string; icon: any }[] = [
        { key: 'clubs', label: 'أندية الخليج', desc: 'تفعيل لوحة معلومات الأندية، إدارة اللاعبين، وعرض صفحات الفرق.', icon: Shield },
        { key: 'matches', label: 'مركز المباريات', desc: 'عرض شريط المباريات المباشرة، النتائج، وجداول الترتيب.', icon: CheckCircle2 },
        { key: 'videos', label: 'مكتبة الفيديو', desc: 'قسم خاص لعرض ملخصات المباريات والمحتوى المرئي.', icon: FilePlus },
        { key: 'analysis', label: 'التحليلات والمقالات', desc: 'قسم المقالات التحليلية الطويلة (بخلاف الأخبار العاجلة).', icon: Search },
        { key: 'autopilot', label: 'AI Auto-Pilot 🤖', desc: 'توليد أخبار تلقائي كل 5 دقائق. (يتطلب مفتاح Gemini API صالحاً).', icon: Wand2 },
        { key: 'userSystem', label: 'نظام المستخدمين', desc: 'تفعيل أو تعطيل تسجيل الدخول، الحسابات، وتشكيلة الأحلام.', icon: Users },
    ];

    return (
        <div className="space-y-6">
            {/* Feature Flags */}
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
                            <div key={feature.key} className={`p-4 rounded-xl border transition-all ${featureFlags[feature.key] ? 'bg-slate-800 border-primary/50' : 'bg-slate-950 border-slate-800 opacity-60'}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className={`p-2 rounded-lg ${featureFlags[feature.key] ? 'bg-primary/20 text-primary' : 'bg-slate-800 text-slate-500'}`}><feature.icon size={20} /></div>
                                    <button onClick={() => setFeatureFlag(feature.key, !featureFlags[feature.key])} className={`transition-colors ${featureFlags[feature.key] ? 'text-primary hover:text-white' : 'text-slate-500 hover:text-white'}`}>
                                        {featureFlags[feature.key] ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                                    </button>
                                </div>
                                <h3 className="text-white font-bold mb-1">{feature.label}</h3>
                                <p className="text-xs text-slate-400 leading-relaxed min-h-[40px]">{feature.desc}</p>
                                <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${featureFlags[feature.key] ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                                    <span className="text-[10px] font-bold text-slate-300 uppercase">{featureFlags[feature.key] ? 'نشط' : 'معطل'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* API Keys */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden animate-in fade-in duration-300">
                <div className="p-6 border-b border-slate-800 bg-slate-950">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><Key className="text-yellow-500" /> مفاتيح API للمصادر الخارجية</h2>
                    <p className="text-slate-400 text-sm mt-2">لأمان أعلى، تدار مفاتيح API عبر متغيرات البيئة في منصة النشر (مثل Vercel).</p>
                </div>
                <div className="p-6 space-y-4">
                    <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/30"><h3 className="text-amber-400 font-bold">متغيرات Gemini AI (لإنشاء المحتوى)</h3></div>
                    <ul className="text-slate-400 font-mono text-sm space-y-2 pl-4">
                        <li><code className="text-amber-400">VITE_GEMINI_API_KEY_ARABIC_LEAGUES</code> <span className="font-sans text-slate-500">- للدوريات العربية</span></li>
                        <li><code className="text-amber-400">VITE_GEMINI_API_KEY_ENGLISH_LEAGUES</code> <span className="font-sans text-slate-500">- للدوريات الإنجليزية</span></li>
                        <li><code className="text-amber-400">VITE_GEMINI_API_KEY_DEFAULT</code> <span className="font-sans text-slate-500">- مفتاح افتراضي/احتياطي</span></li>
                    </ul>

                    <div className="bg-slate-950 p-4 rounded-xl border border-cyan-500/30 mt-6"><h3 className="text-cyan-400 font-bold">متغيرات API-Football (لبيانات المباريات)</h3></div>
                    <ul className="text-slate-400 font-mono text-sm space-y-2 pl-4">
                        <li><code className="text-cyan-400">VITE_APIFOOTBALL_KEY</code> <span className="font-sans text-slate-500">- المفتاح الأساسي للمباريات والترتيب.</span></li>
                        <li><code className="text-cyan-400">APIFOOTBALL_KEY_PERFORMANCE_DATA</code> <span className="font-sans text-slate-500">- (اختياري/سيرفر) مفتاح لمزامنة أداء اللاعبين.</span></li>
                    </ul>

                     <div className="bg-slate-950 p-4 rounded-xl border border-slate-500/30 mt-6"><h3 className="text-slate-300 font-bold">متغيرات Supabase (مطلوب للتشغيل)</h3></div>
                    <ul className="text-slate-400 font-mono text-sm space-y-2 pl-4">
                        <li><code className="text-slate-400">VITE_SUPABASE_URL</code></li>
                        <li><code className="text-slate-400">VITE_SUPABASE_ANON_KEY</code></li>
                    </ul>
                </div>
            </div>

            {/* Sync Engines */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden animate-in fade-in duration-300">
                <div className="p-6 border-b border-slate-800 bg-slate-950">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><Cpu className="text-cyan-400" /> محركات المزامنة التلقائية</h2>
                </div>
                <div className="p-6 space-y-6">
                     {/* Squad Sync */}
                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-white flex items-center gap-2"><Users size={16}/> مزامنة قوائم الفرق (الانتقالات)</h4>
                                <p className="text-xs text-slate-400 mt-1">يعمل تلقائياً كل 12 ساعة فقط أثناء فترات الانتقالات المحددة أدناه.</p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 ${inWindow ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                                <span className={`w-2 h-2 rounded-full ${inWindow ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></span>
                                {inWindow ? 'نشط' : 'متوقف'}
                            </div>
                        </div>
                        <div className="border-t border-slate-800 mt-4 pt-4 flex justify-between items-center">
                            <p className="text-xs text-slate-500 flex-1">{squadsSyncMessage || 'شغل المزامنة يدوياً لتحديث قوائم الفرق فوراً.'}</p>
                            <button onClick={() => handleManualSync('squads')} disabled={isSyncingSquads} className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 disabled:bg-slate-700">
                                {isSyncingSquads ? <Loader2 size={16} className="animate-spin"/> : <RefreshCw size={16}/>}
                                {isSyncingSquads ? 'جاري...' : 'مزامنة الآن'}
                            </button>
                        </div>
                        <details className="mt-3">
                            <summary className="text-xs text-slate-500 cursor-pointer hover:text-white">إعدادات فترات الانتقالات</summary>
                             <ul className="list-disc list-inside space-y-2 text-slate-400 font-mono text-sm mt-2 bg-slate-900 p-3 rounded">
                                <li><code className="text-amber-400">VITE_TRANSFER_WINDOW_SUMMER_START</code> (مثال: 07-01)</li>
                                <li><code className="text-amber-400">VITE_TRANSFER_WINDOW_SUMMER_END</code> (مثال: 09-01)</li>
                                <li><code className="text-amber-400">VITE_TRANSFER_WINDOW_WINTER_START</code> (مثال: 01-01)</li>
                                <li><code className="text-amber-400">VITE_TRANSFER_WINDOW_WINTER_END</code> (مثال: 02-01)</li>
                            </ul>
                        </details>
                    </div>
                     {/* Performance Sync */}
                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                         <h4 className="font-bold text-white flex items-center gap-2"><BarChart2 size={16}/> مزامنة أداء اللاعبين (يومي)</h4>
                         <p className="text-xs text-slate-400 mt-1">يعمل تلقائياً كل يوم لجلب إحصائيات اللاعبين من المباريات المنتهية.</p>
                         <div className="border-t border-slate-800 mt-4 pt-4 flex justify-between items-center">
                            <p className="text-xs text-slate-500 flex-1">{performanceSyncMessage || 'شغل المزامنة يدوياً لجلب بيانات أداء الأمس.'}</p>
                            <button onClick={() => handleManualSync('performance')} disabled={isSyncingPerformance} className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 disabled:bg-slate-700">
                                {isSyncingPerformance ? <Loader2 size={16} className="animate-spin"/> : <RefreshCw size={16}/>}
                                {isSyncingPerformance ? 'جاري...' : 'مزامنة الآن'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper function to check if current date is within a transfer window
const isWithinTransferWindow = () => {
  // In a Vite project, client-side env vars are exposed on import.meta.env.
  // FIX: Using type assertion as a workaround for misconfigured Vite/TS environment.
  const env = (import.meta as any).env;
  const summerStart = env.VITE_TRANSFER_WINDOW_SUMMER_START || '07-01';
  const summerEnd = env.VITE_TRANSFER_WINDOW_SUMMER_END || '09-01';
  const winterStart = env.VITE_TRANSFER_WINDOW_WINTER_START || '01-01';
  const winterEnd = env.VITE_TRANSFER_WINDOW_WINTER_END || '02-01';

  const today = new Date();
  // Format date as MM-DD
  const currentDateStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const isSummer = currentDateStr >= summerStart && currentDateStr <= summerEnd;
  const isWinter = currentDateStr >= winterStart && currentDateStr <= winterEnd;

  return isSummer || isWinter;
};


const ClubsManagerView: React.FC<{
  clubs: ClubProfile[];
  onAdd: (c: ClubProfile) => boolean;
  onUpdate: (c: ClubProfile) => boolean;
  onDelete: (id: string) => boolean;
}> = ({ clubs, onAdd, onUpdate, onDelete }) => {
  const [editingClub, setEditingClub] = useState<Partial<ClubProfile> | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editingPlayer, setEditingPlayer] = useState<Partial<Player> | null>(null);
  const [isPlayerFormOpen, setIsPlayerFormOpen] = useState(false);

  const handleEdit = (club: ClubProfile) => {
    setEditingClub(JSON.parse(JSON.stringify(club))); 
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingClub({
      id: '', name: '', englishName: '', logo: '', country: Category.SAUDI, founded: new Date().getFullYear(),
      apiFootballId: 0,
      colors: { primary: '#10b981', secondary: '#0f172a', text: '#ffffff' },
      stadium: '', coach: '', fanCount: 1000, squad: [], trophies: []
    });
    setIsFormOpen(true);
  };

  const handleSaveClub = (e: React.FormEvent) => {
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
            ? onAdd(clubToSave as ClubProfile)
            : onUpdate(clubToSave as ClubProfile);

        if (success) {
            alert(`تم حفظ النادي "${clubToSave.name}" بنجاح!`);
            setIsFormOpen(false);
            setEditingClub(null);
        }
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeleteClub = (club: ClubProfile) => {
    if (window.confirm(`هل أنت متأكد من حذف نادي ${club.name}؟ لا يمكن التراجع عن هذا الإجراء.`)) {
        const success = onDelete(club.id);
        if (success) {
            alert("تم حذف النادي بنجاح.");
        }
    }
  };

  const handleAddPlayer = () => {
     setEditingPlayer({
        id: Date.now().toString(), name: '', number: 0, position: 'MID', rating: 75,
        stats: { pac: 70, sho: 70, pas: 70, dri: 70, def: 50, phy: 60 }, image: ''
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
      const seed = editingPlayer.name ? editingPlayer.name.replace(/\s/g, '') : Math.random().toString(36);
      const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&gender=male&style=circle`;
      setEditingPlayer({ ...editingPlayer, image: avatarUrl });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden animate-in fade-in duration-300">
      {!isFormOpen ? (
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400">اسم النادي (عربي)</label>
                    <input 
                      type="text" 
                      value={editingClub?.name || ''}
                      onChange={e => setEditingClub({...editingClub, name: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-primary outline-none"
                      required
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400">الاسم (إنجليزي - للرابط)</label>
                    <input 
                      type="text" 
                      value={editingClub?.englishName || ''}
                      onChange={e => setEditingClub({...editingClub, englishName: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-primary outline-none"
                      required
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400">API-Football ID</label>
                    <input 
                      type="number" 
                      value={editingClub?.apiFootballId || ''}
                      onChange={e => setEditingClub({...editingClub, apiFootballId: parseInt(e.target.value)})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-primary outline-none"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400">رابط الشعار</label>
                    <div className="flex gap-2">
                        <input 
                        type="text" 
                        value={editingClub?.logo || ''}
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
                        value={editingClub?.coverImage || ''}
                        onChange={e => setEditingClub({...editingClub, coverImage: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-primary outline-none"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400">الدولة</label>
                    <select 
                       value={editingClub?.country || ''}
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
                      value={editingClub?.coach || ''}
                      onChange={e => setEditingClub({...editingClub, coach: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-primary outline-none"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400">اللون الأساسي (Hex)</label>
                    <div className="flex items-center gap-2">
                        <input 
                        type="color" 
                        value={editingClub?.colors?.primary || '#10b981'}
                        onChange={e => setEditingClub({
                            ...editingClub, 
                            colors: { ...editingClub.colors!, primary: e.target.value }
                        })}
                        className="h-10 w-10 rounded overflow-hidden cursor-pointer border-none p-0"
                        />
                        <input 
                        type="text" 
                        value={editingClub?.colors?.primary || '#10b981'}
                        onChange={e => setEditingClub({
                            ...editingClub, 
                            colors: { ...editingClub.colors!, primary: e.target.value }
                        })}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-white font-mono"
                        />
                    </div>
                 </div>
              </div>

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

           {isPlayerFormOpen && (
               <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                   <div className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95">
                       <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                           <h3 className="font-bold text-white">تعديل بيانات اللاعب</h3>
                           <button onClick={() => setIsPlayerFormOpen(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
                       </div>
                       <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
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
                                       value={editingPlayer?.name || ''}
                                       onChange={e => setEditingPlayer({...editingPlayer, name: e.target.value})}
                                       className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-sm"
                                   />
                                   <div className="flex gap-2">
                                       <input 
                                           placeholder="#"
                                           type="number"
                                           value={editingPlayer?.number || ''}
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
                           <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                               <div className="flex justify-between items-center mb-4">
                                   <span className="text-xs font-bold text-slate-400">إحصائيات البطاقة</span>
                                   <div className="flex items-center gap-2">
                                       <span className="text-xs text-slate-500">التقييم العام</span>
                                       <input 
                                           type="number"
                                           value={editingPlayer?.rating || ''}
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