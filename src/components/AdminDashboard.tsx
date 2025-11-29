import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Menu, List, Shield, Globe, DollarSign, FilePlus, Edit, Trash2, X, User, Save, Wand2, Search, CheckCircle2, Settings, ToggleLeft, ToggleRight, Key, Cpu, Users, Loader2, Eye, Link as LinkIcon, Activity, RefreshCw, BarChart2, Handshake
} from 'lucide-react';
import { Article, Category, ClubProfile, Player, FeatureFlags, Sponsor } from '../types';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';
import TeamLogo from './TeamLogo';
import ArticleEditor from './ArticleEditor';
import { Link } from 'react-router-dom';

const useLocalStorage = <T,>(key: string, initialValue: T): [T, (value: T) => void] => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
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
        </div>
    );
};

const SEOView: React.FC = () => {
    return (
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
           <h2 className="text-white font-bold mb-4">إعدادات SEO</h2>
           <p className="text-slate-400">قم بتكوين إعدادات محركات البحث هنا.</p>
        </div>
    );
};

const AdsView: React.FC = () => {
    return (
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
           <h2 className="text-white font-bold mb-4">إدارة الإعلانات</h2>
           <p className="text-slate-400">أضف أكواد الإعلانات هنا.</p>
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
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><Handshake className="text-primary" /> إدارة الرعاة</h2>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <form onSubmit={handleAdd} className="space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-800 h-fit">
                    <h3 className="font-bold text-white">إضافة راعي جديد</h3>
                    <input value={newSponsor.name} onChange={e => setNewSponsor({...newSponsor, name: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" placeholder="اسم الشركة" required />
                    <input value={newSponsor.logo} onChange={e => setNewSponsor({...newSponsor, logo: e.target.value})} className="flex-1 w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" placeholder="رابط الشعار" required />
                    <button type="submit" className="w-full bg-primary text-slate-900 font-bold py-2 rounded hover:bg-emerald-400 transition-colors">إضافة</button>
                </form>

                <div className="space-y-3">
                     <h3 className="font-bold text-white">الرعاة الحاليين</h3>
                     {sponsors.map(sponsor => (
                         <div key={sponsor.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700">
                             <div className="flex items-center gap-3">
                                 <img src={sponsor.logo} alt={sponsor.name} className="w-8 h-8 object-contain bg-white rounded p-1" />
                                 <p className="font-bold text-white text-sm">{sponsor.name}</p>
                             </div>
                             <button onClick={() => deleteSponsor(sponsor.id)} className="p-2 text-slate-500 hover:text-red-500"><Trash2 size={16} /></button>
                         </div>
                     ))}
                </div>
            </div>
        </div>
    );
};

const ContentListView: React.FC<{
    articles: Article[];
    onEdit: (article: Article) => void;
    onDelete: (id: string) => void;
}> = ({ articles, onEdit, onDelete }) => {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden animate-in fade-in duration-300">
            <div className="p-4 border-b border-slate-800 bg-slate-950">
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
                            <th className="px-6 py-4">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                        {articles.map(article => (
                            <tr key={article.id} className="hover:bg-slate-800/50">
                                <td className="px-6 py-4 font-bold text-white max-w-sm truncate">{article.title}</td>
                                <td className="px-6 py-4"><span className="bg-slate-800 px-2 py-1 rounded text-xs">{article.category}</span></td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => onEdit(article)} className="p-2 hover:bg-primary/20 hover:text-primary rounded-lg transition-colors"><Edit size={16} /></button>
                                        <button onClick={() => onDelete(article.id)} className="p-2 hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-colors"><Trash2 size={16} /></button>
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
  const { clubs, addClub, updateClub, deleteClub, articles, addArticle, updateArticle, deleteArticle, matches } = useData();
  const { featureFlags, setFeatureFlag } = useSettings();
  
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
      title: '', summary: '', content: '', imageUrl: '', category: Category.SAUDI, author: 'محرر goolzon', videoEmbedId: ''
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
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 border-l border-slate-800 transition-all duration-300 flex flex-col fixed h-full z-40`}>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
           {isSidebarOpen && <span className="font-black text-white text-lg">لوحة التحكم</span>}
           <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-400 hover:text-white"><Menu size={20} /></button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
           {navItems.map(item => (
             <button
               key={item.id}
               onClick={() => {
                 if (item.id === 'EDITOR' && activeView !== 'EDITOR') handleNewClick();
                 else setActiveView(item.id as any);
               }}
               className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${activeView === item.id ? 'bg-primary text-slate-900 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
             >
               <item.icon size={20} />
               {isSidebarOpen && <span>{item.label}</span>}
             </button>
           ))}
        </nav>
      </aside>

      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'mr-64' : 'mr-20'} p-6`}>
        {activeView === 'DASHBOARD' && <DashboardView onNavigate={setActiveView} onEditArticle={handleEditClick} />}
        {activeView === 'EDITOR' && <ArticleEditor initialData={editorData} onSave={handleSaveArticle} onCancel={() => setActiveView('LIST')} mode={editorMode} matches={matches} />}
        {activeView === 'LIST' && <ContentListView articles={articles} onEdit={handleEditClick} onDelete={handleDeleteArticle} />}
        {activeView === 'SEO' && <SEOView />}
        {activeView === 'ADS' && <AdsView />}
        {activeView === 'SPONSORS' && <SponsorsView />}
        {activeView === 'CLUBS' && featureFlags.clubs && <div className="text-center py-20 bg-slate-900 rounded-xl text-slate-400">Club Manager Placeholder</div>}
        {activeView === 'SETTINGS' && <div className="text-center py-20 bg-slate-900 rounded-xl text-slate-400">Settings Placeholder</div>}
      </main>
    </div>
  );
};

export default AdminDashboard;