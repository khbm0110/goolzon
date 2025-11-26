import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Article, Match, Standing, ClubProfile, Category, Player } from '../types';
import { INITIAL_ARTICLES, INITIAL_MATCHES, INITIAL_STANDINGS, CLUB_DATABASE } from '../constants';
import { fetchLiveMatches, fetchStandings } from '../services/apiFootball';
import { getSupabase } from '../services/supabaseClient';
import { useSettings } from './SettingsContext';

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
  transferPlayer: (playerId: string, sourceClubId: string, targetClubId: string, price: number) => void;
  isLoadingInitial: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { apiConfig } = useSettings();
  const [articles, setArticles] = useState<Article[]>([]);
  const [matches, setMatches] = useState<Match[]>(INITIAL_MATCHES);
  const [standings, setStandings] = useState<Standing[]>(INITIAL_STANDINGS);
  const [clubs, setClubs] = useState<ClubProfile[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  const addArticle = async (article: Article): Promise<boolean> => {
    const supabase = getSupabase(apiConfig.supabaseUrl, apiConfig.supabaseKey);
    if (!supabase) {
        alert("Supabase is not configured. Article saved locally only.");
        setArticles(prev => [article, ...prev]);
        return true;
    }
    const { imageUrl, isBreaking, videoEmbedId, ...restOfArticle } = article;
    const articleForDb = {
        ...restOfArticle,
        "imageUrl": imageUrl || '',
        "isBreaking": isBreaking ?? false,
        "videoEmbedId": videoEmbedId ?? '',
    };
    delete (articleForDb as any).sources;

    const { error } = await supabase.from('articles').insert(articleForDb);
    if (error) {
        console.error("Supabase add article error:", error);
        alert(`Failed to save article: ${error.message}`);
        return false;
    }
    setArticles(prev => [article, ...prev]);
    return true;
  };

  const updateArticle = async (article: Article): Promise<boolean> => {
     // Implementation for Supabase update would go here
     console.warn("Update article not fully implemented for Supabase yet.");
     setArticles(prev => prev.map(a => a.id === article.id ? article : a));
     return true;
  }

  const deleteArticle = async (id: string): Promise<boolean> => {
     // Implementation for Supabase delete would go here
     console.warn("Delete article not fully implemented for Supabase yet.");
     setArticles(prev => prev.filter(a => a.id !== id));
     return true;
  }

  const addClub = async (club: ClubProfile): Promise<boolean> => {
      const supabase = getSupabase(apiConfig.supabaseUrl, apiConfig.supabaseKey);
      if (!supabase) { alert("Supabase not configured."); return false; }
      
      const { squad, englishName, coverImage, fanCount, ...clubData } = club;
      const clubForDb = {
          ...clubData,
          "englishName": englishName,
          "coverImage": coverImage,
          "fanCount": fanCount,
      };
      
      const { error } = await supabase.from('clubs').insert(clubForDb);
      
      if (error) {
          console.error("Supabase add club error:", error);
          alert(`Failed to save club: ${error.message}`);
          return false;
      }
      setClubs(prev => [...prev, club]);
      return true;
  };

  const updateClub = async (club: ClubProfile): Promise<boolean> => {
      const supabase = getSupabase(apiConfig.supabaseUrl, apiConfig.supabaseKey);
      if (!supabase) { alert("Supabase not configured."); return false; }

      // We only update the club's metadata, not the squad in this operation
      // Squad updates are handled via transferPlayer for now.
      const { squad, englishName, coverImage, fanCount, ...clubData } = club;
      const clubForDb = {
          ...clubData,
          "englishName": englishName,
          "coverImage": coverImage,
          "fanCount": fanCount,
      };

      const { error } = await supabase.from('clubs').update(clubForDb).eq('id', club.id);
      
      if (error) {
          console.error("Supabase update club error:", error);
          alert(`Failed to update club: ${error.message}`);
          return false;
      }
      setClubs(prev => prev.map(c => c.id === club.id ? club : c));
      return true;
  };

  const deleteClub = async (id: string): Promise<boolean> => {
      const supabase = getSupabase(apiConfig.supabaseUrl, apiConfig.supabaseKey);
      if (!supabase) { alert("Supabase not configured."); return false; }
      
      const { error } = await supabase.from('clubs').delete().eq('id', id);
      
      if (error) {
          console.error("Supabase delete club error:", error);
          alert(`Failed to delete club: ${error.message}`);
          return false;
      }
      setClubs(prev => prev.filter(c => c.id !== id));
      return true;
  };

  const transferPlayer = (playerId: string, sourceClubId: string, targetClubId: string, price: number) => {
      // This is a local-only operation for now as there's no player table in Supabase yet.
      // A full implementation would involve updating player records in a 'players' table.
      setClubs(prevClubs => {
          const newClubs = prevClubs.map(c => ({...c, squad: [...c.squad]}));
          const sourceClub = newClubs.find(c => c.id === sourceClubId);
          const targetClub = newClubs.find(c => c.id === targetClubId);
          if (!sourceClub || !targetClub) return prevClubs;

          const playerIndex = sourceClub.squad.findIndex(p => p.id === playerId);
          if (playerIndex === -1) return prevClubs;

          const [player] = sourceClub.squad.splice(playerIndex, 1);
          
          const transferArticle: Article = {
              id: `transfer-${Date.now()}`,
              title: `رسمياً: ${player.name} ينتقل من ${sourceClub.name} إلى ${targetClub.name} مقابل ${price} مليون`,
              summary: `أعلن نادي ${targetClub.name} اليوم عن تعاقده مع اللاعب ${player.name} قادماً من ${sourceClub.name} في صفقة بلغت قيمتها ${price} مليون يورو.`,
              content: `في خطوة لتعزيز صفوفه، أتم نادي ${targetClub.name} إجراءات ضم النجم ${player.name}.`,
              imageUrl: player.image || targetClub.coverImage,
              category: targetClub.country,
              date: new Date().toISOString(),
              author: 'Bot الانتقالات',
              views: Math.floor(Math.random() * 5000) + 1000,
              isBreaking: true
          };

          addArticle(transferArticle);

          targetClub.squad.push(player);
          return newClubs;
      });
  };

  useEffect(() => {
     const initializeApp = async () => {
         setIsLoadingInitial(true);
         const supabase = getSupabase(apiConfig.supabaseUrl, apiConfig.supabaseKey);
         
         if (supabase) {
             console.log("Supabase client initialized. Fetching data...");
             try {
                 const [articlesRes, clubsRes] = await Promise.all([
                     supabase.from('articles').select('*').order('date', { ascending: false }).limit(50),
                     supabase.from('clubs').select('*')
                 ]);

                 if (articlesRes.error) throw articlesRes.error;
                 const articlesFromDb = articlesRes.data || [];
                 setArticles(articlesFromDb.map((a: any) => ({
                     ...a,
                     imageUrl: a.imageUrl,
                     isBreaking: a.isBreaking,
                     videoEmbedId: a.videoEmbedId,
                 })));

                 if (clubsRes.error) throw clubsRes.error;
                 const clubsFromDb = clubsRes.data || [];
                 // Enrich clubs from DB with local squad data (as squad is not in DB yet)
                 const clubsWithMockSquads = (clubsFromDb).map((dbClub: any) => {
                    const mockClub = Object.values(CLUB_DATABASE).find(c => c.id === dbClub.id);
                    return { 
                        ...dbClub, 
                        englishName: dbClub.englishName,
                        coverImage: dbClub.coverImage,
                        fanCount: dbClub.fanCount,
                        squad: mockClub?.squad || [] 
                    };
                 });
                 setClubs(clubsWithMockSquads);
                 
             } catch (error) {
                 console.error("Error fetching from Supabase:", error);
                 alert("فشل الاتصال بـ Supabase. تحقق من الإعدادات أو أمان RLS. سيتم عرض البيانات المؤقتة.");
                 setArticles(INITIAL_ARTICLES);
                 setClubs(Object.values(CLUB_DATABASE).filter(c => c.id !== 'generic'));
             }
         } else {
             console.log("No Supabase config. Using initial mock data.");
             setArticles(INITIAL_ARTICLES);
             setClubs(Object.values(CLUB_DATABASE).filter(c => c.id !== 'generic'));
         }
         
         setIsLoadingInitial(false);
     };

     initializeApp();
  }, [apiConfig.supabaseUrl, apiConfig.supabaseKey]);

  useEffect(() => {
     let interval: ReturnType<typeof setInterval> | null = null;
     const syncData = async () => {
         if (apiConfig.keys.matches) {
             const liveMatches = await fetchLiveMatches(apiConfig.keys.matches, apiConfig.leagueIds);
             setMatches(liveMatches); 
             
             const liveStandings = await fetchStandings(apiConfig.keys.matches, apiConfig.leagueIds);
             setStandings(liveStandings.length > 0 ? liveStandings : []);
         }
     };
     syncData();
     if (apiConfig.autoSync) {
         interval = setInterval(syncData, 60000); // 60 seconds
     }
     return () => {
         if (interval) clearInterval(interval);
     }
  }, [apiConfig.keys.matches, apiConfig.leagueIds, apiConfig.autoSync]);

  const value = {
      articles, addArticle, updateArticle, deleteArticle,
      matches, standings, clubs, addClub, updateClub, deleteClub,
      transferPlayer, isLoadingInitial
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};