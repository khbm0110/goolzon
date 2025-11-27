import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Article, Match, Standing, ClubProfile, Category, Player } from '../types';
import { INITIAL_ARTICLES, CLUB_DATABASE } from '../constants';
import { fetchLiveMatches, fetchStandings } from '../services/apiFootball';
import { useSettings } from './SettingsContext';
import { getSupabase } from '../services/supabaseClient';

// Environment variables are read from `process.env` for broader compatibility.
const API_FOOTBALL_KEY = process.env.VITE_APIFOOTBALL_KEY;

interface DataContextType {
  articles: Article[];
  addArticle: (article: Article) => Promise<boolean>;
  updateArticle: (article: Article) => Promise<boolean>;
  deleteArticle: (id: string) => Promise<boolean>;
  matches: Match[];
  standings: Standing[];
  clubs: ClubProfile[];
  addClub: (club: ClubProfile) => boolean;
  updateClub: (club: ClubProfile) => boolean;
  deleteClub: (id: string) => boolean;
  transferPlayer: (playerId: string, sourceClubId: string, targetClubId: string, price: number) => void;
  isLoadingInitial: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};

const useLocalStorageState = <T,>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [state, setState] = useState<T>(() => {
        try {
            const storedValue = localStorage.getItem(key);
            return storedValue ? JSON.parse(storedValue) : defaultValue;
        } catch (error) {
            console.error(`Error reading localStorage key “${key}”:`, error);
            return defaultValue;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error(`Error setting localStorage key “${key}”:`, error);
        }
    }, [key, state]);

    return [state, setState];
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { apiConfig } = useSettings();
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [clubs, setClubs] = useLocalStorageState<ClubProfile[]>('goolzon_clubs', Object.values(CLUB_DATABASE));
  
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  // This effect will run once on mount to fetch all necessary data.
  // It relies on the getSupabase() singleton which reads from env vars.
  useEffect(() => {
    const supabase = getSupabase(); // Get client from env vars
    
    const fetchAllData = async () => {
        setIsLoadingInitial(true);

        // --- Articles Data ---
        if (!supabase) {
            console.warn("Supabase is not configured via env vars. Falling back to local initial articles.");
            setArticles(INITIAL_ARTICLES);
        } else {
            console.log("Attempting to fetch articles from Supabase...");
            const { data, error } = await supabase
                .from('articles')
                .select('*')
                .order('date', { ascending: false });

            if (error) {
                console.error("Error fetching articles from Supabase:", error);
                setArticles(INITIAL_ARTICLES); // Fallback on error
            } else if (data) {
                console.log("Successfully fetched articles from Supabase.", data.length);
                setArticles(data);
            }
        }

        // --- Sports API Data ---
        if (API_FOOTBALL_KEY) {
            const [liveMatches, leagueStandings] = await Promise.all([
                fetchLiveMatches(API_FOOTBALL_KEY, apiConfig.leagueIds),
                fetchStandings(API_FOOTBALL_KEY, apiConfig.leagueIds)
            ]);
            setMatches(liveMatches);
            setStandings(leagueStandings);
        } else {
            console.warn("VITE_APIFOOTBALL_KEY not configured. Skipping matches and standings fetch.");
            setMatches([]);
            setStandings([]);
        }

        setIsLoadingInitial(false);
    };
    
    fetchAllData();
  }, [apiConfig.leagueIds]);


  const addArticle = async (article: Article): Promise<boolean> => {
    const supabase = getSupabase();
    if (!supabase) {
        console.warn("Supabase not configured. Adding article to local state only.");
        setArticles(prev => [article, ...prev]);
        return true;
    }
    const { error } = await supabase.from('articles').insert([article]);
    if (error) {
        console.error("Error adding article to Supabase:", error);
        alert(`Supabase Error: ${error.message}`);
        return false;
    }
    setArticles(prev => [article, ...prev]); // Optimistic update
    return true;
  };

  const updateArticle = async (article: Article): Promise<boolean> => {
     const supabase = getSupabase();
     if (!supabase) {
        console.warn("Supabase not configured. Updating article in local state only.");
        setArticles(prev => prev.map(a => a.id === article.id ? article : a));
        return true;
     }
     const { error } = await supabase.from('articles').update(article).eq('id', article.id);
     if (error) {
        console.error("Error updating article in Supabase:", error);
        alert(`Supabase Error: ${error.message}`);
        return false;
     }
     setArticles(prev => prev.map(a => a.id === article.id ? article : a)); // Optimistic update
     return true;
  }

  const deleteArticle = async (id: string): Promise<boolean> => {
     const supabase = getSupabase();
     if (!supabase) {
        console.warn("Supabase not configured. Deleting article from local state only.");
        setArticles(prev => prev.filter(a => a.id !== id));
        return true;
     }
     const { error } = await supabase.from('articles').delete().eq('id', id);
     if (error) {
        console.error("Error deleting article from Supabase:", error);
        alert(`Supabase Error: ${error.message}`);
        return false;
     }
     setArticles(prev => prev.filter(a => a.id !== id)); // Optimistic update
     return true;
  }

  const addClub = (club: ClubProfile): boolean => {
      setClubs(prev => [...prev, club]);
      return true;
  };

  const updateClub = (club: ClubProfile): boolean => {
      setClubs(prev => prev.map(c => c.id === club.id ? club : c));
      return true;
  };

  const deleteClub = (id: string): boolean => {
      setClubs(prev => prev.filter(c => c.id !== id));
      return true;
  };

  const transferPlayer = (playerId: string, sourceClubId: string, targetClubId: string, price: number) => {
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

          addArticle(transferArticle);
          targetClub.squad.push(player);
          return newClubs;
      });
  };

  const value = {
    articles, addArticle, updateArticle, deleteArticle,
    matches,
    standings,
    clubs, addClub, updateClub, deleteClub, transferPlayer,
    isLoadingInitial
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};