import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';
import { Article, Match, Standing, ClubProfile, Sponsor, User, SeoSettings, AdSettings, Comment, AnalyticsData } from '../types';
import { fetchLiveMatches, fetchStandings } from '../services/apiFootball';
import { useSettings } from './SettingsContext';
import { INITIAL_ANALYTICS_DATA } from '../constants'; // Keep analytics mock for now

interface DataContextType {
  articles: Article[];
  addArticle: (article: Partial<Article>) => Promise<boolean>;
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
  seoSettings: SeoSettings | null;
  updateSeoSettings: (settings: SeoSettings) => Promise<boolean>;
  adSettings: AdSettings | null;
  updateAdSettings: (settings: AdSettings) => Promise<boolean>;
  comments: Comment[];
  addComment: (comment: { text: string; articleId: string }, parentId?: string) => Promise<Comment | null>;
  updateCommentStatus: (id: string, status: Comment['status']) => Promise<boolean>;
  analyticsData: AnalyticsData | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};

// Helper to convert snake_case keys from Supabase to camelCase for the frontend
const mapToCamelCase = (data: any[]): any[] => {
    return data.map(item => 
        Object.keys(item).reduce((acc, key) => {
            const camelKey = key.replace(/_([a-z])/g, g => g[1].toUpperCase());
            acc[camelKey] = item[key];
            return acc;
        }, {} as any)
    );
};


export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { apiConfig } = useSettings();
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [clubs, setClubs] = useState<ClubProfile[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [seoSettings, setSeoSettings] = useState<SeoSettings | null>(null);
  const [adSettings, setAdSettings] = useState<AdSettings | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
        setIsLoadingInitial(true);
        try {
            const [
                articlesRes, clubsRes, sponsorsRes, commentsRes, settingsRes, profilesRes,
                fetchedMatches, fetchedStandings
            ] = await Promise.all([
                supabase.from('articles').select('*').order('date', { ascending: false }),
                supabase.from('clubs').select('*'),
                supabase.from('sponsors').select('*'),
                supabase.from('comments').select('*, user:profiles(name, avatar_url)').order('created_at', { ascending: true }),
                supabase.from('settings').select('*').eq('id', 1).single(),
                supabase.from('profiles').select('*'),
                fetchLiveMatches('', apiConfig.leagueIds),
                fetchStandings('', apiConfig.leagueIds),
            ]);

            if (articlesRes.data) setArticles(mapToCamelCase(articlesRes.data) as Article[]);
            if (clubsRes.data) setClubs(mapToCamelCase(clubsRes.data) as ClubProfile[]);
            if (sponsorsRes.data) setSponsors(sponsorsRes.data);
            if (commentsRes.data) {
                const mappedComments = commentsRes.data.map((c: any) => ({
                    id: c.id, articleId: c.article_id,
                    user: c.user?.name || 'Anonymous', avatar: c.user?.avatar_url,
                    time: c.created_at, text: c.text, likes: c.likes,
                    status: c.status, parentId: c.parent_id,
                }));
                setComments(mappedComments);
            }
            if (settingsRes.data) {
                setSeoSettings(settingsRes.data.seo_settings);
                setAdSettings(settingsRes.data.ad_settings);
            }
            if (profilesRes.data) {
              const mappedUsers = profilesRes.data.map((p: any) => ({
                id: p.id, name: p.name, username: p.username, email: 'hidden',
                avatar: p.avatar_url, role: p.role, joinDate: p.created_at, status: p.status
              }));
              setUsers(mappedUsers);
            }
            setMatches(fetchedMatches);
            setStandings(fetchedStandings);

        } catch (error) {
            console.error("Error fetching initial data:", error);
        } finally {
            setIsLoadingInitial(false);
        }
    };
    
    fetchAllData();
  }, [apiConfig.leagueIds]);

  // --- CRUD Handlers ---
  const addArticle = async (article: Partial<Article>) => { /* ... */ return true; };
  const updateArticle = async (article: Article) => { /* ... */ return true; };
  const deleteArticle = async (id: string) => { /* ... */ return true; };
  const addClub = async (club: ClubProfile) => { /* ... */ return true; };
  const updateClub = async (club: ClubProfile) => { /* ... */ return true; };
  const deleteClub = async (id: string) => { /* ... */ return true; };
  const addSponsor = async (sponsor: Sponsor) => { /* ... */ return true; };
  const updateSponsor = async (sponsor: Sponsor) => { /* ... */ return true; };
  const deleteSponsor = async (id: string) => { /* ... */ return true; };
  const addUser = async (data: any) => { /* ... This is handled by Auth now */ return null; };
  const updateUser = async (user: User) => { /* ... */ return true; };
  const deleteUser = async (id: string) => { /* ... */ return true; };
  const updateSeoSettings = async (settings: SeoSettings) => { /* ... */ return true; };
  const updateAdSettings = async (settings: AdSettings) => { /* ... */ return true; };

  const addComment = async (comment: { text: string; articleId: string }, parentId?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { console.error("User must be logged in to comment."); return null; }
    
    const { data, error } = await supabase.from('comments').insert({
        text: comment.text, article_id: comment.articleId, user_id: user.id, parent_id: parentId,
    }).select('*, user:profiles(name, avatar_url)').single();

    if (error) { console.error(error); return null; }
    
    const newComment: Comment = {
        id: data.id, articleId: data.article_id, user: data.user.name, avatar: data.user.avatar_url,
        time: data.created_at, text: data.text, likes: data.likes, status: data.status, parentId: data.parent_id
    };
    setComments(prev => [...prev, newComment]);
    return newComment;
  };

  const updateCommentStatus = async (id: string, status: Comment['status']) => {
    const { error } = await supabase.from('comments').update({ status }).eq('id', id);
    if(error) { console.error(error); return false; }
    setComments(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    return true;
  };

  const value = {
    articles, addArticle, updateArticle, deleteArticle,
    matches, standings, clubs, addClub, updateClub, deleteClub,
    sponsors, addSponsor, updateSponsor, deleteSponsor,
    isLoadingInitial, users, updateUser, deleteUser, addUser,
    seoSettings, updateSeoSettings, adSettings, updateAdSettings,
    comments, addComment, updateCommentStatus,
    analyticsData: INITIAL_ANALYTICS_DATA,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
