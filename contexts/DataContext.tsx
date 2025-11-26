import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Article, Match, Standing, ClubProfile, Category, Player } from '../types';
import { INITIAL_ARTICLES, CLUB_DATABASE } from '../constants';
import { fetchLiveMatches, fetchStandings } from '../services/apiFootball';
import { useSettings } from './SettingsContext';
import { getSupabase } from '../services/supabaseClient';

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
  const { apiConfig, supabaseConfig } = useSettings();
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [clubs, setClubs] = useLocalStorageState<ClubProfile[]>('goolzon_clubs', Object.values(CLUB_DATABASE));
  
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    const supabase = getSupabase(supabaseConfig.url, supabaseConfig.anonKey);
    
    const fetchInitialData = async () => {
        setIsLoadingInitial(true);

        // Fetch articles from Supabase
        if (!supabase) {
            console.warn("Supabase not configured. Using local fallback data for articles.");
            setArticles(INITIAL_ARTICLES);
        } else {
            console.log("Fetching articles from Supabase...");
            const { data, error } = await supabase
                .from('articles')
                .select('*')
                .order('date', { ascending: false });

            if (error) {
                console.error("Error fetching articles:", error);
                setArticles(INITIAL_ARTICLES);
            } else if (data) {
                setArticles(data);
            }
        }

        // Fetch matches and standings from API
        if (apiConfig.keys.matches) {
            const [liveMatches, leagueStandings] = await Promise.all([
                fetchLiveMatches(apiConfig.keys.matches, apiConfig.leagueIds),
                fetchStandings(apiConfig.keys.matches, apiConfig.leagueIds)
            ]);
            setMatches(liveMatches);
            setStandings(leagueStandings);
        } else {
            setMatches([]);
            setStandings([]);
        }

        setIsLoadingInitial(false);
        setIsDataLoaded(true);
    };
    
    // This now controls all initial data loading
    if (!isDataLoaded) {
       fetchInitialData();
    }
  }, [supabaseConfig, apiConfig.keys.matches, apiConfig.leagueIds, isDataLoaded]);


  const addArticle = async (article: Article): Promise<boolean> => {
    const supabase = getSupabase(supabaseConfig.url, supabaseConfig.anonKey);
    if (!supabase) {
        setArticles(prev => [article, ...prev]);
        return true;
    }
    const { error } = await supabase.from('articles').insert([article]);
    if (error) {
        console.error("Error adding article:", error);
        alert(`Error: ${error.message}`);
        return false;
    }
    setArticles(prev => [article, ...prev]);
    return true;
  };

  const updateArticle = async (article: Article): Promise<boolean> => {
     const supabase = getSupabase(supabaseConfig.url, supabaseConfig.anonKey);
     if (!supabase) {
        setArticles(prev => prev.map(a => a.id === article.id ? article : a));
        return true;
     }
     const { error } = await supabase.from('articles').update(article).eq('id', article.id);
     if (error) {
        console.error("Error updating article:", error);
        alert(`Error: ${error.message}`);
        return false;
     }
     setArticles(prev => prev.map(a => a.id === article.id ? article : a));
     return true;
  }

  const deleteArticle = async (id: string): Promise<boolean> => {
     const supabase = getSupabase(supabaseConfig.url, supabaseConfig.anonKey);
     if (!supabase) {
        setArticles(prev => prev.filter(a => a.id !== id));
        return true;
     }
     const { error } = await supabase.from('articles').delete().eq('id', id);
     if (error) {
        console.error("Error deleting article:", error);
        alert(`Error: ${error.message}`);
        return false;
     }
     setArticles(prev => prev.filter(a => a.id !== id));
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