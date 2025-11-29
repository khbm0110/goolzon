import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Article, Match, Standing, ClubProfile, Sponsor, User, SeoSettings, AdSettings, Comment, AnalyticsData } from '../types';
import { INITIAL_ARTICLES, CLUB_DATABASE, INITIAL_ANALYTICS_DATA } from '../constants';
import { fetchLiveMatches, fetchStandings } from '../services/apiFootball';
import { useSettings } from './SettingsContext';

// FIX: Added missing types for mock data to ensure type safety with AdminDashboard
interface DataContextType {
  articles: Article[];
  addArticle: (article: Article) => Promise<boolean>;
  updateArticle: (article: Article) => Promise<boolean>;
  deleteArticle: (id: string) => Promise<boolean>;
  matches: Match[];
  standings: Standing[];
  clubs: ClubProfile[];
  addClub: (club: ClubProfile) => Promise<boolean>;
  updateClub: (club: ClubProfile) => Promise<boolean>;
  deleteClub: (id: string) => Promise<boolean>;
  sponsors: Sponsor[];
  addSponsor: (sponsor: Sponsor) => Promise<boolean>;
  updateSponsor: (sponsor: Sponsor) => Promise<boolean>;
  deleteSponsor: (id: string) => Promise<boolean>;
  isLoadingInitial: boolean;
  users: User[];
  updateUser: (user: User) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  addUser: (data: any) => Promise<User | null>;
  seoSettings: SeoSettings;
  updateSeoSettings: (settings: SeoSettings) => Promise<boolean>;
  adSettings: AdSettings;
  updateAdSettings: (settings: AdSettings) => Promise<boolean>;
  comments: Comment[];
  addComment: (comment: any, parentId?: string) => Promise<Comment | null>;
  updateCommentStatus: (id: string, status: Comment['status']) => Promise<boolean>;
  analyticsData: AnalyticsData | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};

// --- MOCK DATA INITIALIZATION ---

const INITIAL_SPONSORS: Sponsor[] = [
    { id: '1', name: 'طيران الخليج', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e9/Gulf_Air_Logo.svg/1200px-Gulf_Air_Logo.svg.png', url: '#', active: true },
    { id: '2', name: 'stc', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/STC_Logo_2019.svg/1200px-STC_Logo_2019.svg.png', url: '#', active: true },
    { id: '3', name: 'أرامكو', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Aramco_Logo.svg/1200px-Aramco_Logo.svg.png', url: '#', active: true },
];

const INITIAL_USERS: User[] = [
    { id: 'admin-1', name: 'المدير العام', username: 'admin', email: 'admin@goolzon.com', role: 'admin', joinDate: new Date().toISOString(), avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', status: 'active' },
    { id: 'user-1', name: 'مستخدم تجريبي', username: 'demo_user', email: 'demo@goolzon.com', role: 'user', joinDate: new Date().toISOString(), avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo', status: 'active' },
];

const INITIAL_SEO_SETTINGS: SeoSettings = {
    siteTitle: 'goolzon | الكرة الخليجية',
    metaDescription: 'المصدر الأول لأخبار الرياضة الخليجية والعالمية.',
    metaKeywords: 'كرة قدم, رياضة, الدوري السعودي, الهلال, النصر',
    ogImageUrl: 'https://example.com/og-image.png'
};

const INITIAL_AD_SETTINGS: AdSettings = {
    provider: 'none',
    headerAd: { code: '', enabled: false },
    sidebarAd: { code: '', enabled: false },
    inArticleAd: { code: '', enabled: false },
};

const INITIAL_COMMENTS: Comment[] = [
    { id: 'c1', articleId: '1', user: 'خالد السبيعي', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=khalid', time: 'منذ 5 دقائق', text: 'تحليل رائع وموضوعي كالعادة. شكراً goolzon!', likes: 12, status: 'visible' },
    { id: 'c2', articleId: '1', user: 'مشجع هلالي', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hilalifan', time: 'منذ 15 دقيقة', text: 'هذا تعليق يحتاج للمراجعة بسبب محتواه.', likes: 1, status: 'reported' },
    { id: 'c3', articleId: '2', user: 'فاطمة أحمد', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=fatima', time: 'منذ 20 دقيقة', text: 'أتفق مع كل كلمة، الفريق يحتاج إلى مهاجم صريح في أقرب وقت.', likes: 5, status: 'visible' },
];

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { apiConfig } = useSettings();
  
  // State for all data slices
  const [articles, setArticles] = useState<Article[]>(INITIAL_ARTICLES);
  const [clubs, setClubs] = useState<ClubProfile[]>(Object.values(CLUB_DATABASE));
  const [sponsors, setSponsors] = useState<Sponsor[]>(INITIAL_SPONSORS);
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [seoSettings, setSeoSettings] = useState<SeoSettings>(INITIAL_SEO_SETTINGS);
  const [adSettings, setAdSettings] = useState<AdSettings>(INITIAL_AD_SETTINGS);
  const [comments, setComments] = useState<Comment[]>(INITIAL_COMMENTS);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  // Effect for fetching external API data (matches, standings)
  useEffect(() => {
    const loadApiData = async () => {
        setIsLoadingInitial(true);
        const [fetchedMatches, fetchedStandings] = await Promise.all([
          fetchLiveMatches('', apiConfig.leagueIds),
          fetchStandings('', apiConfig.leagueIds)
        ]);
        setMatches(fetchedMatches);
        setStandings(fetchedStandings);
        setIsLoadingInitial(false);
    };
    
    loadApiData();
  }, [apiConfig.leagueIds]);

  // --- Mock CRUD Handlers ---
  const addArticle = async (article: Article) => { setArticles(prev => [article, ...prev]); return true; };
  const updateArticle = async (article: Article) => { setArticles(prev => prev.map(a => a.id === article.id ? article : a)); return true; };
  const deleteArticle = async (id: string) => { setArticles(prev => prev.filter(a => a.id !== id)); return true; };
  
  const addClub = async (club: ClubProfile) => { setClubs(prev => [...prev, club]); return true; };
  const updateClub = async (club: ClubProfile) => { setClubs(prev => prev.map(c => c.id === club.id ? club : c)); return true; };
  const deleteClub = async (id: string) => { setClubs(prev => prev.filter(c => c.id !== id)); return true; };
  
  const addSponsor = async (sponsor: Sponsor) => { setSponsors(prev => [...prev, sponsor]); return true; };
  const updateSponsor = async (sponsor: Sponsor) => { setSponsors(prev => prev.map(s => s.id === sponsor.id ? sponsor : s)); return true; };
  const deleteSponsor = async (id: string) => { setSponsors(prev => prev.filter(s => s.id !== id)); return true; };

  const addUser = async (data: any) => { const newUser: User = {...data, id: `user-${Date.now()}`, joinDate: new Date().toISOString(), avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`, status: 'active'}; setUsers(prev => [...prev, newUser]); return newUser; };
  const updateUser = async (user: User) => { setUsers(prev => prev.map(u => u.id === user.id ? user : u)); return true; };
  const deleteUser = async (id: string) => { setUsers(prev => prev.filter(u => u.id !== id)); return true; };

  const updateSeoSettings = async (settings: SeoSettings) => { setSeoSettings(settings); return true; };
  const updateAdSettings = async (settings: AdSettings) => { setAdSettings(settings); return true; };

  const addComment = async (comment: { text: string; user: string; avatar: string; articleId: string }, parentId?: string) => {
    const newComment: Comment = {
      ...comment,
      id: `comment-${Date.now()}`,
      time: 'الآن',
      likes: 0,
      status: 'visible',
      parentId,
    };
    setComments(prev => [...prev, newComment]);
    return newComment;
  };
  const updateCommentStatus = async (id: string, status: Comment['status']) => { setComments(prev => prev.map(c => c.id === id ? { ...c, status } : c)); return true; };

  const value = {
    articles, addArticle, updateArticle, deleteArticle,
    matches,
    standings,
    clubs, addClub, updateClub, deleteClub,
    sponsors, addSponsor, updateSponsor, deleteSponsor,
    isLoadingInitial,
    users, updateUser, deleteUser, addUser,
    seoSettings, updateSeoSettings,
    adSettings, updateAdSettings,
    comments, addComment, updateCommentStatus,
    analyticsData: INITIAL_ANALYTICS_DATA,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};