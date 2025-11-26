import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Article, Match, Standing, ClubProfile, Category, Player } from '../types';
import { INITIAL_ARTICLES, CLUB_DATABASE } from '../constants';
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
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [clubs, setClubs] = useState<ClubProfile[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  const addArticle = async (article: Article): Promise<boolean> => {
    const supabase = getSupabase(apiConfig.supabaseUrl, apiConfig.supabaseKey);
    if (!supabase) {
        alert("Supabase is not configured. Article saved locally only.");
        setArticles(prev => [article, ...prev]);
        return true;
    }
    
    // Explicitly map to the database schema to prevent unknown columns
    // This fixes the error where extra properties like 'hasNews' were sent.
    const articleForDb = {
        id: article.id,
        title: article.title,
        summary: article.summary,
        content: article.content,
        imageUrl: article.imageUrl,
        category: article.category,
        date: article.date,
        author: article.author,
        views: article.views,
        isBreaking: article.isBreaking ?? false,
        videoEmbedId: article.videoEmbedId || null,
    };

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
     setArticles(prev => prev.map(a => a.id === article.id ? article : a));
     
     const supabase = getSupabase(apiConfig.supabaseUrl, apiConfig.supabaseKey);
     if (!supabase) {
        console.warn("Supabase not configured. Article updated locally only.");
        return true;
     }

     const articleForDb = {
        id: article.id,
        title: article.title,
        summary: article.summary,
        content: article.content,
        imageUrl: article.imageUrl,
        category: article.category,
        date: article.date,
        author: article.author,
        views: article.views,
        isBreaking: article.isBreaking ?? false,
        videoEmbedId: article.videoEmbedId || null,
    };

     const { error } = await supabase.from('articles').update(articleForDb).eq('id', article.id);
     if (error) {
        console.error("Supabase update article error:", error);
        alert(`Failed to update article: ${error.message}`);
        return false;
     }

     return true;
  }

  const deleteArticle = async (id: string): Promise<boolean> => {
     setArticles(prev => prev.filter(a => a.id !== id));

     const supabase = getSupabase(apiConfig.supabaseUrl, apiConfig.supabaseKey);
     if (!supabase) {
        console.warn("Supabase not configured. Article deleted locally only.");
        return true;
     }

     const { error } = await supabase.from('articles').delete().eq('id', id);
     if (error) {
        console.error("Supabase delete article error:", error);
        alert(`Failed to delete article: ${error.message}`);
        // Optionally revert local state
        return false;
     }

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
              isBreaking: true,
          };

          addArticle(transferArticle); // Add a news article about the transfer
          targetClub.squad.push(player);
          return newClubs;
      });
  };

  useEffect(() => {
    const fetchData = async () => {
        setIsLoadingInitial(true);

        const supabase = getSupabase(apiConfig.supabaseUrl, apiConfig.supabaseKey);

        if (supabase) {
            console.log("Fetching data from Supabase...");
            const { data: dbArticles, error: articlesError } = await supabase.from('articles').select('*').order('date', { ascending: false });
            const { data: dbClubs, error: clubsError } = await supabase.from('clubs').select('*');

            if (articlesError) console.error("Supabase articles error:", articlesError);
            if (clubsError) console.error("Supabase clubs error:", clubsError);
            
            setArticles(dbArticles || []);
            // For now, we use local squad data as it's not in the DB yet.
            // A production app would fetch players and join them.
            const clubsWithSquads = (dbClubs || []).map(dbClub => {
                const localClub = CLUB_DATABASE[dbClub.id];
                return { ...dbClub, squad: localClub ? localClub.squad : [] };
            });
            setClubs(clubsWithSquads);
        } else {
            console.warn("Supabase not configured. Application will run with no initial data.");
            // Start with empty data if Supabase isn't configured, instead of mock data.
            setArticles([]);
            setClubs([]);
        }

        if (apiConfig.keys.matches) {
            console.log("Fetching live sports data...");
            const [liveMatches, leagueStandings] = await Promise.all([
                fetchLiveMatches(apiConfig.keys.matches, apiConfig.leagueIds),
                fetchStandings(apiConfig.keys.matches, apiConfig.leagueIds)
            ]);
            setMatches(liveMatches);
            setStandings(leagueStandings);
        } else {
            console.warn("API-Sports key not configured. Match/Standing data will be empty.");
            setMatches([]);
            setStandings([]);
        }

        setIsLoadingInitial(false);
    };

    fetchData();
  }, [apiConfig]);

  const value = {
    articles, addArticle, updateArticle, deleteArticle,
    matches,
    standings,
    clubs, addClub, updateClub, deleteClub, transferPlayer,
    isLoadingInitial
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
