
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Article, Category, ClubProfile, Sponsor, FeatureFlags, Match, SeoSettings, AdSettings, User, AnalyticsData, Comment, VisitorCountry, DevicePerformance, PagePerformance, Goal, PageSpeed, VisitorStats } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import ArticleEditor from './ArticleEditor';
import { Shield, Plus, Edit, Trash2, LayoutGrid, FileText, Users, ShoppingBag, Settings, X, Globe, Megaphone, UserCheck, Ban, BarChart2, MessageCircle, Check, AlertTriangle, Clock, Monitor, Smartphone, ArrowDownToLine, ArrowUpFromLine, Target, Timer, ArrowUp, ArrowDown } from 'lucide-react';

type AdminTab = 'OVERVIEW' | 'ARTICLES' | 'CLUBS' | 'SPONSORS' | 'SETTINGS' | 'SEO' | 'ADS' | 'ADMINS' | 'USERS' | 'ANALYTICS' | 'MODERATION';

const AdminDashboard: React.FC = () => {
    const { 
        articles, addArticle, updateArticle, deleteArticle, 
        clubs, addClub, updateClub, deleteClub,
        sponsors, addSponsor, updateSponsor, deleteSponsor,
        matches,
        users, updateUser, deleteUser, addUser,
        seoSettings, updateSeoSettings,
        adSettings, updateAdSettings,
        comments, updateCommentStatus,
        analyticsData,
    } = useData();
    const { featureFlags, setFeatureFlag } = useSettings();
    const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');
    
    // State for modals
    const [editingArticle, setEditingArticle] = useState<Partial<Article> | null>(null);
    const [editingClub, setEditingClub] = useState<ClubProfile | null>(null);
    const [isClubEditorOpen, setIsClubEditorOpen] = useState(false);
    const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
    const [isSponsorEditorOpen, setIsSponsorEditorOpen] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUserRole, setEditingUserRole] = useState<'admin' | 'user'>('user');

    // --- Article Handlers ---
    const handleSaveArticle = async (articleData: Article) => {
        if (articleData.id && !articleData.id.startsWith('new-')) {
            await updateArticle(articleData);
        } else {
            const newArticle: Article = { ...articleData, id: `article-${Date.now()}`, date: new Date().toISOString(), author: 'Admin', views: 0 };
            await addArticle(newArticle);
        }
        setEditingArticle(null);
    };
    const handleNewArticle = () => setEditingArticle({ id: 'new-article', title: '', summary: '', content: '', category: Category.SAUDI, imageUrl: '' });
    const handleEditArticle = (article: Article) => setEditingArticle(article);
    const handleDeleteArticle = async (id: string) => {
        if (window.confirm('هل أنت متأكد أنك تريد حذف هذا المقال؟')) { await deleteArticle(id); }
    };

    // --- Club Handlers ---
    const handleSaveClub = async (clubData: ClubProfile) => {
        if (clubs.some(c => c.id === clubData.id)) { await updateClub(clubData); } else { await addClub(clubData); }
        setIsClubEditorOpen(false);
    }
    const handleNewClub = () => {
        setEditingClub({ id: `club-${Date.now()}`, name: '', englishName: '', apiFootballId: 0, logo: '', coverImage: '', founded: new Date().getFullYear(), stadium: '', coach: '', nickname: '', colors: {primary: '#10b981', secondary: '#0f172a', text: '#ffffff'}, social: {twitter: '', instagram: ''}, fanCount: 0, squad: [], trophies: [], country: Category.SAUDI });
        setIsClubEditorOpen(true);
    };
    const handleEditClub = (club: ClubProfile) => { setEditingClub(club); setIsClubEditorOpen(true); };
    const handleDeleteClub = async (id: string) => {
        if (window.confirm('هل أنت متأكد أنك تريد حذف هذا النادي؟')) { await deleteClub(id); }
    };
    
    // --- Sponsor Handlers ---
    const handleSaveSponsor = async (sponsorData: Sponsor) => {
        if (sponsors.some(s => s.id === sponsorData.id)) { await updateSponsor(sponsorData); } else { await addSponsor(sponsorData); }
        setIsSponsorEditorOpen(false);
    };
    const handleNewSponsor = () => {
        setEditingSponsor({id: `sponsor-${Date.now()}`, name: '', logo: '', url: '', active: true });
        setIsSponsorEditorOpen(true);
    };
    const handleEditSponsor = (sponsor: Sponsor) => { setEditingSponsor(sponsor); setIsSponsorEditorOpen(true); };
    const handleDeleteSponsor = async (id: string) => {
        if (window.confirm('هل أنت متأكد أنك تريد حذف هذا الراعي؟')) { await deleteSponsor(id); }
    };
    
     // --- User Handlers ---
    const handleToggleUserStatus = async (user: User) => {
        const newStatus = user.status === 'active' ? 'banned' : 'active';
        if (window.confirm(`هل أنت متأكد أنك تريد ${newStatus === 'banned' ? 'حظر' : 'إلغاء حظر'} هذا المستخدم؟`)) {
            await updateUser({ ...user, status: newStatus });
        }
    };
    const handleDeleteUser = async (id: string, name: string) => {
        if (window.confirm(`هل أنت متأكد أنك تريد حذف المستخدم ${name} بشكل دائم؟`)) { await deleteUser(id); }
    };
    const handleAddNewUser = (role: 'admin' | 'user') => { setEditingUserRole(role); setIsUserModalOpen(true); };
    const handleSaveNewUser = async (email: string, name: string) => { await addUser({ email, name, role: editingUserRole }); setIsUserModalOpen(false); };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'OVERVIEW': return <OverviewTabStats articles={articles} clubs={clubs} matches={matches} users={users} />;
            case 'ARTICLES': return <ArticlesTab articles={articles} onNew={handleNewArticle} onEdit={handleEditArticle} onDelete={handleDeleteArticle} />;
            case 'CLUBS': return <ClubsTab clubs={clubs} onNew={handleNewClub} onEdit={handleEditClub} onDelete={handleDeleteClub} />;
            case 'SPONSORS': return <SponsorsTab sponsors={sponsors} onNew={handleNewSponsor} onEdit={handleEditSponsor} onDelete={handleDeleteSponsor} />;
            case 'ANALYTICS': return <AnalyticsTab analyticsData={analyticsData} articles={articles} />;
            case 'MODERATION': return <ModerationTab comments={comments} onUpdateStatus={updateCommentStatus} />;
            case 'SEO': return <SeoTab settings={seoSettings} onSave={updateSeoSettings} />;
            case 'ADS': return <AdsTab settings={adSettings} onSave={updateAdSettings} />;
            case 'ADMINS': return <UsersManagementTab role="admin" users={users} onToggleStatus={handleToggleUserStatus} onDelete={handleDeleteUser} onAddNew={() => handleAddNewUser('admin')} />;
            case 'USERS': return <UsersManagementTab role="user" users={users} onToggleStatus={handleToggleUserStatus} onDelete={handleDeleteUser} onAddNew={() => handleAddNewUser('user')} />;
            case 'SETTINGS': return <SettingsTab featureFlags={featureFlags} setFeatureFlag={setFeatureFlag} />;
            default: return null;
        }
    }

    const tabs: { id: AdminTab, label: string, icon: React.ElementType }[] = [
        { id: 'OVERVIEW', label: 'نظرة عامة', icon: LayoutGrid },
        { id: 'ANALYTICS', label: 'التحليلات', icon: BarChart2 },
        { id: 'ARTICLES', label: 'المقالات', icon: FileText },
        { id: 'MODERATION', label: 'الإشراف', icon: MessageCircle },
        { id: 'CLUBS', label: 'الأندية', icon: Users },
        { id: 'SPONSORS', label: 'الرعاة', icon: ShoppingBag },
        { id: 'SEO', label: 'تحسينات SEO', icon: Globe },
        { id: 'ADS', label: 'الإعلانات', icon: Megaphone },
        { id: 'ADMINS', label: 'المشرفون', icon: UserCheck },
        { id: 'USERS', label: 'المستخدمون', icon: Users },
        { id: 'SETTINGS', label: 'الإعدادات', icon: Settings },
    ];

    if (editingArticle) {
        return <div className="container mx-auto px-4 py-8"><ArticleEditor initialData={editingArticle} onSave={handleSaveArticle} onCancel={() => setEditingArticle(null)} mode={editingArticle.id?.startsWith('new-') ? 'NEW' : 'EDIT'} matches={matches} /></div>
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-black text-white mb-8 flex items-center"><Shield className="text-red-500 ml-3" /> لوحة تحكم المدير</h1>
            <div className="flex flex-col md:flex-row gap-8">
                <aside className="md:w-1/4 lg:w-1/5">
                    <nav className="flex flex-row md:flex-col gap-2 bg-slate-900 border border-slate-800 rounded-xl p-3 overflow-x-auto no-scrollbar">
                        {tabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-3 w-full text-right p-3 rounded-lg font-bold transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                                <tab.icon size={20} /> {tab.label}
                            </button>
                        ))}
                    </nav>
                </aside>
                <main className="flex-1">{renderTabContent()}</main>
            </div>
            {isClubEditorOpen && editingClub && <ClubEditorModal club={editingClub} onSave={handleSaveClub} onClose={() => setIsClubEditorOpen(false)} />}
            {isSponsorEditorOpen && editingSponsor && <SponsorEditorModal sponsor={editingSponsor} onSave={handleSaveSponsor} onClose={() => setIsSponsorEditorOpen(false)} />}
            {isUserModalOpen && <AddUserModal role={editingUserRole} onSave={handleSaveNewUser} onClose={() => setIsUserModalOpen(false)} />}
        </div>
    );
};

// --- TAB COMPONENTS ---

const OverviewTabStats: React.FC<{articles: Article[], clubs: ClubProfile[], matches: Match[], users: User[]}> = ({articles, clubs, matches, users}) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in">
        <StatCard title="إجمالي المقالات" value={articles.length} icon={FileText} />
        <StatCard title="إجمالي الأندية" value={clubs.length} icon={Shield} />
        <StatCard title="مباريات اليوم" value={matches.length} icon={LayoutGrid} />
        <StatCard title="إجمالي المستخدمين" value={users.length} icon={Users} />
    </div>
);
const StatCard: React.FC<{title:string, value: number | string, icon: React.ElementType}> = ({title, value, icon: Icon}) => (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-center gap-4">
        <div className="bg-primary/10 text-primary p-3 rounded-lg"><Icon size={24} /></div>
        <div>
            <div className="text-3xl font-black text-white">{value}</div>
            <div className="text-sm text-slate-400">{title}</div>
        </div>
    </div>
);

const ArticlesTab: React.FC<{articles: Article[], onNew:()=>void, onEdit:(a:Article)=>void, onDelete:(id:string)=>void}> = ({articles, onNew, onEdit, onDelete}) => (
    <div className="bg-slate-900 border border-slate-800 rounded-xl animate-in fade-in">
        <div className="p-4 flex justify-between items-center border-b border-slate-800">
            <h2 className="text-xl font-bold text-white">إدارة المقالات</h2>
            <button onClick={onNew} className="flex items-center gap-2 bg-primary text-slate-900 font-bold px-4 py-2 rounded-lg hover:bg-emerald-400 transition-colors"><Plus size={18} /> مقال جديد</button>
        </div>
        <div className="overflow-x-auto"><Table headers={["العنوان", "القسم", "التاريخ", "الإجراءات"]}>
            {articles.map(article => (
                <tr key={article.id} className="hover:bg-slate-800/50">
                    <td className="p-3 text-white font-medium">{article.title}</td>
                    <td className="p-3">{article.category}</td>
                    <td className="p-3">{new Date(article.date).toLocaleDateString('ar-SA')}</td>
                    <td className="p-3"><ActionButtons onEdit={() => onEdit(article)} onDelete={() => onDelete(article.id)} /></td>
                </tr>
            ))}
        </Table></div>
    </div>
);

const ClubsTab: React.FC<{clubs: ClubProfile[], onNew:()=>void, onEdit:(c:ClubProfile)=>void, onDelete:(id:string)=>void}> = ({clubs, onNew, onEdit, onDelete}) => (
    <div className="bg-slate-900 border border-slate-800 rounded-xl animate-in fade-in">
        <div className="p-4 flex justify-between items-center border-b border-slate-800">
            <h2 className="text-xl font-bold text-white">إدارة الأندية</h2>
            <button onClick={onNew} className="flex items-center gap-2 bg-primary text-slate-900 font-bold px-4 py-2 rounded-lg hover:bg-emerald-400 transition-colors"><Plus size={18} /> نادٍ جديد</button>
        </div>
        <div className="overflow-x-auto"><Table headers={["النادي", "الدولة", "المدرب", "الإجراءات"]}>
            {clubs.map(club => (
                <tr key={club.id} className="hover:bg-slate-800/50">
                    <td className="p-3 text-white font-medium">{club.name}</td>
                    <td className="p-3">{club.country}</td>
                    <td className="p-3">{club.coach}</td>
                    <td className="p-3"><ActionButtons onEdit={() => onEdit(club)} onDelete={() => onDelete(club.id)} /></td>
                </tr>
            ))}
        </Table></div>
    </div>
);

const SponsorsTab: React.FC<{sponsors: Sponsor[], onNew:()=>void, onEdit:(s:Sponsor)=>void, onDelete:(id:string)=>void}> = ({sponsors, onNew, onEdit, onDelete}) => (
    <div className="bg-slate-900 border border-slate-800 rounded-xl animate-in fade-in">
        <div className="p-4 flex justify-between items-center border-b border-slate-800">
            <h2 className="text-xl font-bold text-white">إدارة الرعاة</h2>
            <button onClick={onNew} className="flex items-center gap-2 bg-primary text-slate-900 font-bold px-4 py-2 rounded-lg hover:bg-emerald-400 transition-colors"><Plus size={18} /> راعٍ جديد</button>
        </div>
        <div className="overflow-x-auto"><Table headers={["الراعي", "الحالة", "الإجراءات"]}>
            {sponsors.map(sponsor => (
                <tr key={sponsor.id} className="hover:bg-slate-800/50">
                    <td className="p-3 text-white font-medium">{sponsor.name}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 text-xs rounded-full ${sponsor.active ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>{sponsor.active ? 'نشط' : 'غير نشط'}</span></td>
                    <td className="p-3"><ActionButtons onEdit={() => onEdit(sponsor)} onDelete={() => onDelete(sponsor.id)} /></td>
                </tr>
            ))}
        </Table></div>
    </div>
);

const SettingsTab: React.FC<{featureFlags: FeatureFlags, setFeatureFlag: (key: keyof FeatureFlags, value: boolean) => void}> = ({featureFlags, setFeatureFlag}) => (
     <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-in fade-in">
        <h2 className="text-xl font-bold text-white mb-6">إدارة الميزات (Feature Flags)</h2>
        <div className="space-y-4">
            {Object.keys(featureFlags).map(key => (
                <div key={key} className="flex items-center justify-between bg-slate-800/50 p-4 rounded-lg">
                    <span className="font-bold text-slate-300">{key}</span>
                    <ToggleSwitch checked={featureFlags[key as keyof FeatureFlags]} onChange={(e) => setFeatureFlag(key as keyof FeatureFlags, e.target.checked)} />
                </div>
            ))}
        </div>
     </div>
);

const SeoTab: React.FC<{settings: SeoSettings, onSave: (s: SeoSettings) => void}> = ({settings, onSave}) => {
    const [data, setData] = useState(settings);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setData({...data, [e.target.name]: e.target.value});
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(data); alert('تم حفظ إعدادات SEO'); };

    return (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-in fade-in space-y-6">
            <h2 className="text-xl font-bold text-white">إعدادات تحسين محركات البحث (SEO)</h2>
            <InputField label="عنوان الموقع" name="siteTitle" value={data.siteTitle} onChange={handleChange} />
            <TextareaField label="الوصف التعريفي للموقع (Meta Description)" name="metaDescription" value={data.metaDescription} onChange={handleChange} rows={3} />
            <TextareaField label="الكلمات المفتاحية (Meta Keywords)" name="metaKeywords" value={data.metaKeywords} onChange={handleChange} rows={2} helper="افصل بين الكلمات بفاصلة ," />
            <InputField label="رابط صورة المشاركة (OG Image)" name="ogImageUrl" value={data.ogImageUrl} onChange={handleChange} />
            <div className="pt-4 flex justify-end"><button type="submit" className="px-6 py-2 rounded-lg bg-primary text-slate-900 font-bold hover:bg-emerald-400">حفظ التغييرات</button></div>
        </form>
    )
}

const AdsTab: React.FC<{settings: AdSettings, onSave: (s: AdSettings) => void}> = ({settings, onSave}) => {
    const [data, setData] = useState(settings);
    // Explicit keys to avoid spread error
    const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>, key: 'headerAd' | 'sidebarAd' | 'inArticleAd') => setData(prev => ({...prev, [key]: {...prev[key], code: e.target.value}}));
    const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>, key: 'headerAd' | 'sidebarAd' | 'inArticleAd') => setData(prev => ({...prev, [key]: {...prev[key], enabled: e.target.checked}}));
    const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => setData(prev => ({...prev, provider: e.target.value as AdSettings['provider']}));
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(data); alert('تم حفظ إعدادات الإعلانات'); };

    return (
         <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-in fade-in space-y-8">
            <h2 className="text-xl font-bold text-white">إدارة الإعلانات</h2>
            <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">مزود الخدمة</label>
                <select value={data.provider} onChange={handleProviderChange} className="w-full md:w-1/2 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:border-primary outline-none">
                    <option value="none">لا يوجد (معطل)</option><option value="adsense">Google AdSense</option><option value="other">أخرى</option>
                </select>
            </div>
            <AdSlot field="headerAd" label="شفرة إعلان الهيدر" data={data} onCodeChange={handleCodeChange} onToggleChange={handleToggleChange} />
            <AdSlot field="sidebarAd" label="شفرة إعلان الشريط الجانبي" data={data} onCodeChange={handleCodeChange} onToggleChange={handleToggleChange} />
            <AdSlot field="inArticleAd" label="شفرة إعلان داخل المقال" data={data} onCodeChange={handleCodeChange} onToggleChange={handleToggleChange} />
            <div className="pt-4 flex justify-end"><button type="submit" className="px-6 py-2 rounded-lg bg-primary text-slate-900 font-bold hover:bg-emerald-400">حفظ التغييرات</button></div>
        </form>
    )
}

const AdSlot: React.FC<{field: 'headerAd' | 'sidebarAd' | 'inArticleAd', label: string, data: AdSettings, onCodeChange: any, onToggleChange: any}> = ({field, label, data, onCodeChange, onToggleChange}) => (
    <div className="space-y-3">
        <div className="flex items-center justify-between"><label className="text-sm font-bold text-slate-300">{label}</label><ToggleSwitch checked={data[field].enabled} onChange={(e) => onToggleChange(e, field)} /></div>
        <TextareaField name={field} value={data[field].code} onChange={(e) => onCodeChange(e, field)} rows={4} placeholder="<script>...</script>" label="الكود" />
    </div>
);

const UsersManagementTab: React.FC<{role: 'admin' | 'user', users: User[], onToggleStatus: (u: User)=>void, onDelete:(id:string, name:string)=>void, onAddNew:()=>void}> = ({role, users, onToggleStatus, onDelete, onAddNew}) => {
    const filteredUsers = users.filter(u => u.role === role);
    const title = role === 'admin' ? 'إدارة المشرفين' : 'إدارة المستخدمين';
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl animate-in fade-in">
            <div className="p-4 flex justify-between items-center border-b border-slate-800"><h2 className="text-xl font-bold text-white">{title}</h2><button onClick={onAddNew} className="flex items-center gap-2 bg-primary text-slate-900 font-bold px-4 py-2 rounded-lg hover:bg-emerald-400 transition-colors"><Plus size={18} /> إضافة جديد</button></div>
            <div className="overflow-x-auto"><Table headers={["المستخدم", "البريد الإلكتروني", "الحالة", "الإجراءات"]}>
                {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-slate-800/50">
                        <td className="p-3 text-white font-medium flex items-center gap-3"><img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full bg-slate-700" />{user.name}</td>
                        <td className="p-3 text-slate-400 font-mono">{user.email}</td>
                        <td className="p-3"><span className={`px-2 py-0.5 text-xs rounded-full ${user.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{user.status === 'active' ? 'نشط' : 'محظور'}</span></td>
                        <td className="p-3"><div className="flex gap-2"><button onClick={() => onToggleStatus(user)} className="p-2 text-slate-400 hover:text-yellow-500 transition-colors" title={user.status === 'active' ? 'حظر' : 'إلغاء الحظر'}><Ban size={16} /></button><button onClick={() => onDelete(user.id, user.name)} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="حذف"><Trash2 size={16} /></button></div></td>
                    </tr>
                ))}
            </Table></div>
        </div>
    )
}

const ModerationTab: React.FC<{ comments: Comment[], onUpdateStatus: (id: string, status: Comment['status']) => void }> = ({ comments, onUpdateStatus }) => {
    const reportedComments = comments.filter(c => c.status === 'reported');
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl animate-in fade-in">
             <div className="p-4 border-b border-slate-800"><h2 className="text-xl font-bold text-white flex items-center gap-2"><AlertTriangle className="text-yellow-500" />تعليقات للمراجعة ({reportedComments.length})</h2></div>
             {reportedComments.length > 0 ? (
                <div className="divide-y divide-slate-800">
                    {reportedComments.map(comment => (
                        <div key={comment.id} className="p-4 space-y-3">
                            <div className="flex items-start gap-3">
                                <img src={comment.avatar} alt={comment.user} className="w-8 h-8 rounded-full" />
                                <div className="flex-1">
                                    <div className="flex justify-between items-center"><span className="text-sm font-bold text-slate-300">{comment.user}</span><span className="text-xs text-slate-500">على مقال: <Link to={`/article/${comment.articleId}`} className="text-primary hover:underline">عرض المقال</Link></span></div>
                                    <p className="text-sm text-slate-400 mt-1 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">{comment.text}</p>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button onClick={() => onUpdateStatus(comment.id, 'hidden')} className="px-4 py-1.5 text-xs font-bold bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20">حذف</button>
                                <button onClick={() => onUpdateStatus(comment.id, 'visible')} className="px-4 py-1.5 text-xs font-bold bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 flex items-center gap-1"><Check size={14}/> موافقة</button>
                            </div>
                        </div>
                    ))}
                </div>
             ) : (
                <div className="p-10 text-center text-slate-500"><p>لا توجد تعليقات بحاجة للمراجعة حالياً.</p></div>
             )}
        </div>
    )
};

const AnalyticsTab: React.FC<{ analyticsData: AnalyticsData | null, articles: Article[] }> = ({ analyticsData, articles }) => {
    if (!analyticsData) return <div className="p-6 text-slate-500">لا توجد بيانات تحليلية لعرضها.</div>;
    
    const topArticles = [...articles].sort((a,b) => b.views - a.views).slice(0, 5);
    const maxVisitors = Math.max(...analyticsData.dailyVisitors.map(d => d.visitors));

    return (
        <div className="space-y-8 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <VisitorTrendsCard stats={analyticsData.visitorStats} />
                <StatCard title="معدل الارتداد" value={`${analyticsData.summary.bounceRate}%`} icon={BarChart2} />
                <StatCard title="متوسط مدة الجلسة" value={analyticsData.summary.avgSessionDuration} icon={Clock} />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-6">الزوار خلال آخر 7 أيام</h3>
                <div className="flex justify-between items-end gap-2 h-48">
                    {analyticsData.dailyVisitors.map(day => (
                        <div key={day.day} className="flex-1 flex flex-col items-center justify-end gap-2 group">
                            <div className="text-white font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity">{day.visitors}</div>
                            <div className="w-full bg-primary/20 hover:bg-primary/40 rounded-t-lg transition-colors" style={{ height: `${(day.visitors / maxVisitors) * 100}%` }}></div>
                            <span className="text-xs text-slate-400 font-bold">{day.day}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <VisitorCountriesCard countries={analyticsData.visitorCountries} />
                <DevicePerformanceCard devices={analyticsData.devicePerformance} />
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">المقالات الأكثر قراءة</h3>
                    <ul className="space-y-3">
                        {topArticles.map((article, index) => (
                            <li key={article.id} className="flex items-center gap-3 text-sm"><span className="font-black text-slate-600 text-lg w-6 text-center">{index+1}</span><Link to={`/article/${article.id}`} className="text-slate-300 hover:text-primary truncate">{article.title}</Link></li>
                        ))}
                    </ul>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">مصادر الزيارات</h3>
                    <ul className="space-y-4">
                        {analyticsData.trafficSources.map(source => (
                            <li key={source.source} className="space-y-2">
                                <div className="flex justify-between items-center text-sm font-bold"><span className="text-slate-300">{source.source}</span><span className="text-slate-400 font-mono">{source.value}%</span></div>
                                <div className="w-full h-2 rounded-full bg-slate-800"><div className={`${source.color} h-2 rounded-full`} style={{width: `${source.value}%`}}></div></div>
                            </li>
                        ))}
                    </ul>
                </div>
                <PageFlowCard landing={analyticsData.landingPages} exit={analyticsData.exitPages} />
                <GoalTrackingCard goals={analyticsData.goals} />
                <div className="lg:col-span-2">
                    <SiteSpeedCard speeds={analyticsData.pageSpeeds} />
                </div>
            </div>
        </div>
    )
}


// --- ADVANCED ANALYTICS CARDS ---

const VisitorTrendsCard: React.FC<{ stats: VisitorStats }> = ({ stats }) => {
    type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';
    const [activePeriod, setActivePeriod] = useState<Period>('daily');

    const periods: { key: Period, label: string }[] = [
        { key: 'daily', label: 'يومي' },
        { key: 'weekly', label: 'أسبوعي' },
        { key: 'monthly', label: 'شهري' },
        { key: 'yearly', label: 'سنوي' },
    ];

    const currentData = stats[activePeriod];

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">تحليل الزوار</h3>
                <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
                    {periods.map(p => (
                        <button
                            key={p.key}
                            onClick={() => setActivePeriod(p.key)}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${activePeriod === p.key ? 'bg-primary text-slate-900' : 'text-slate-400 hover:bg-slate-700'}`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex items-end gap-4">
                <p className="text-5xl font-black text-white">{currentData.total.toLocaleString()}</p>
                <div className={`flex items-center gap-1 font-bold text-sm ${currentData.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {currentData.change >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                    <span>{Math.abs(currentData.change)}%</span>
                </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">مقارنة بالفترة السابقة</p>
        </div>
    );
};

const VisitorCountriesCard: React.FC<{ countries: VisitorCountry[] }> = ({ countries }) => {
    const maxVisitors = countries.length > 0 ? Math.max(...countries.map(c => c.visitors)) : 0;
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Globe size={18} className="text-primary" /> أهم الدول الزائرة</h3>
            <ul className="space-y-4">
                {countries.map(country => (
                    <li key={country.code}>
                        <div className="flex items-center gap-3 text-sm mb-1">
                            <img src={`https://flagcdn.com/w20/${country.code}.png`} alt={country.name} className="w-5 h-auto rounded-sm" />
                            <span className="font-bold text-slate-300">{country.name}</span>
                            <span className="mr-auto font-mono text-slate-400">{country.visitors.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800">
                            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${(country.visitors / maxVisitors) * 100}%` }}></div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const DevicePerformanceCard: React.FC<{ devices: DevicePerformance[] }> = ({ devices }) => (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-full flex flex-col">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Monitor size={18} className="text-primary" /> الأداء حسب الجهاز</h3>
        <div className="flex justify-around items-center pt-4 flex-1">
            {devices.map(d => (
                <div key={d.device} className="text-center">
                    {d.device === 'Desktop' ? <Monitor size={32} className="mx-auto text-slate-400 mb-2"/> : <Smartphone size={32} className="mx-auto text-slate-400 mb-2"/>}
                    <span className="text-3xl font-black text-white">{d.value}%</span>
                    <p className="text-xs text-slate-500 mt-1">{d.device === 'Desktop' ? 'كمبيوتر' : 'موبايل'}</p>
                </div>
            ))}
        </div>
    </div>
);

const PageFlowCard: React.FC<{ landing: PagePerformance[], exit: PagePerformance[] }> = ({ landing, exit }) => (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">أهم صفحات الدخول والخروج</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h4 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2"><ArrowDownToLine size={16} /> صفحات الدخول</h4>
                <ul className="space-y-2 text-xs">
                    {landing.map(p => <li key={p.path} className="flex justify-between p-2 bg-slate-800/50 rounded"><span className="font-mono text-slate-300 truncate">{p.path}</span> <span className="font-bold text-primary">{p.visits.toLocaleString()}</span></li>)}
                </ul>
            </div>
            <div>
                <h4 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2"><ArrowUpFromLine size={16} /> صفحات الخروج</h4>
                <ul className="space-y-2 text-xs">
                    {exit.map(p => <li key={p.path} className="flex justify-between p-2 bg-slate-800/50 rounded"><span className="font-mono text-slate-300 truncate">{p.path}</span> <span className="font-bold text-primary">{p.visits.toLocaleString()}</span></li>)}
                </ul>
            </div>
        </div>
    </div>
);

const GoalTrackingCard: React.FC<{ goals: Goal[] }> = ({ goals }) => (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Target size={18} className="text-primary"/> تتبع الأهداف</h3>
        <ul className="space-y-3">
            {goals.map(g => (
                <li key={g.name} className="flex items-center justify-between text-sm p-3 bg-slate-800/50 rounded-lg">
                    <span className="text-slate-300 font-medium">{g.name}</span>
                    <div className="flex items-center gap-3">
                        <span className="font-mono text-white font-bold">{g.completions.toLocaleString()}</span>
                        <span className="text-xs font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full">{g.conversionRate}%</span>
                    </div>
                </li>
            ))}
        </ul>
    </div>
);

const SiteSpeedCard: React.FC<{ speeds: PageSpeed[] }> = ({ speeds }) => {
    const getStatusColor = (time: number) => {
        if (time < 1.5) return 'bg-green-500'; // Good
        if (time < 3) return 'bg-yellow-500'; // Average
        return 'bg-red-500'; // Slow
    };
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Timer size={18} className="text-primary"/> تحليل سرعة الموقع</h3>
            <ul className="space-y-2">
                {speeds.map(s => (
                    <li key={s.path} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg text-sm">
                        <div className="flex items-center gap-3">
                            <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(s.loadTime)}`}></div>
                            <span className="font-mono text-slate-300">{s.path}</span>
                        </div>
                        <span className="font-bold text-white">{s.loadTime} ثانية</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};


// --- HELPER COMPONENTS ---
const AddUserModal: React.FC<{role: 'admin' | 'user', onSave: (email: string, name: string) => void, onClose: ()=>void}> = ({role, onSave, onClose}) => {
    const [email, setEmail] = useState(''); const [name, setName] = useState('');
    const handleSubmit = () => { if (email && name) onSave(email, name); };
    return <Modal title={`إضافة ${role === 'admin' ? 'مشرف' : 'مستخدم'} جديد`} onClose={onClose} onSave={handleSubmit}><div className="space-y-4 text-sm">
        <InputField label="الاسم الكامل" name="name" value={name} onChange={(e) => setName(e.target.value)} />
        <InputField label="البريد الإلكتروني" name="email" value={email} onChange={(e) => setEmail(e.target.value)} />
    </div></Modal>
}
const ToggleSwitch: React.FC<{checked: boolean, onChange: (e:React.ChangeEvent<HTMLInputElement>)=>void}> = ({checked, onChange}) => (<label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" /><div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div></label>);
const Table: React.FC<{headers: string[], children: React.ReactNode}> = ({headers, children}) => (<table className="w-full text-sm text-right"><thead className="text-slate-400"><tr className="border-b border-slate-800">{headers.map(h => <th key={h} className="p-3 font-bold">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-800">{children}</tbody></table>);
const ActionButtons: React.FC<{onEdit:()=>void, onDelete:()=>void}> = ({onEdit, onDelete}) => (<div className="flex gap-2"><button onClick={onEdit} className="p-2 text-slate-400 hover:text-primary transition-colors" title="تعديل"><Edit size={16} /></button><button onClick={onDelete} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="حذف"><Trash2 size={16} /></button></div>);
const ClubEditorModal: React.FC<{club: ClubProfile, onSave: (c: ClubProfile) => void, onClose:()=>void}> = ({club, onSave, onClose}) => {
    const [data, setData] = useState(club); const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setData({...data, [e.target.name]: e.target.value});
    const handleComplexChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => { try { setData({...data, [e.target.name]: JSON.parse(e.target.value) }); } catch (err) { console.error("Invalid JSON") } }
    const handleSubmit = () => onSave(data);
    return <Modal title="تعديل النادي" onClose={onClose} onSave={handleSubmit}><div className="space-y-4 text-sm"><InputField label="الاسم" name="name" value={data.name} onChange={handleChange} /><InputField label="الاسم (إنجليزي)" name="englishName" value={data.englishName} onChange={handleChange} /><TextareaField label="اللاعبون (JSON)" name="squad" value={JSON.stringify(data.squad, null, 2)} onChange={handleComplexChange} rows={5} /><TextareaField label="البطولات (JSON)" name="trophies" value={JSON.stringify(data.trophies, null, 2)} onChange={handleComplexChange} rows={3} /></div></Modal>
}
const SponsorEditorModal: React.FC<{sponsor: Sponsor, onSave: (s: Sponsor) => void, onClose:()=>void}> = ({sponsor, onSave, onClose}) => {
    const [data, setData] = useState(sponsor); const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setData({...data, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value});
    const handleSubmit = () => onSave(data);
    return <Modal title="تعديل الراعي" onClose={onClose} onSave={handleSubmit}><div className="space-y-4 text-sm"><InputField label="الاسم" name="name" value={data.name} onChange={handleChange} /><InputField label="شعار (URL)" name="logo" value={data.logo} onChange={handleChange} /><InputField label="موقع (URL)" name="url" value={data.url} onChange={handleChange} /><div className="flex items-center gap-2"><input type="checkbox" name="active" checked={data.active} onChange={handleChange} className="w-4 h-4" /><label>نشط</label></div></div></Modal>
}
const Modal: React.FC<{title:string, children:React.ReactNode, onClose:()=>void, onSave:()=>void}> = ({title, children, onClose, onSave}) => (<div className="fixed inset-0 z-[100] flex items-center justify-center p-4"><div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={onClose}></div><div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"><div className="p-4 flex justify-between items-center border-b border-slate-800"><h3 className="font-bold text-lg">{title}</h3><button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full"><X size={20}/></button></div><div className="p-6 overflow-y-auto">{children}</div><div className="p-4 flex justify-end gap-4 border-t border-slate-800"><button onClick={onClose} className="px-6 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 font-bold">إلغاء</button><button onClick={onSave} className="px-6 py-2 rounded-lg bg-primary text-slate-900 font-bold hover:bg-emerald-400">حفظ</button></div></div></div>);
const InputField: React.FC<{label: string, name: string, value: any, onChange: (e:React.ChangeEvent<HTMLInputElement>)=>void}> = ({label, name, value, onChange}) => (<div><label className="block text-xs font-bold text-slate-400 mb-1">{label}</label><input name={name} value={value} onChange={onChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:border-primary outline-none" /></div>);
const TextareaField: React.FC<{label: string, name: string, value: any, onChange: (e:React.ChangeEvent<HTMLTextAreaElement>)=>void, rows: number, helper?:string, placeholder?:string}> = ({label, name, value, onChange, rows, helper, placeholder}) => (<div><label className="block text-xs font-bold text-slate-400 mb-1">{label}</label><textarea name={name} value={value} onChange={onChange} rows={rows} placeholder={placeholder} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:border-primary outline-none font-mono text-xs" />{helper && <p className="text-xs text-slate-500 mt-1">{helper}</p>}</div>);

export default AdminDashboard;
