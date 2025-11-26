import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Article, Match, Standing, ClubProfile, Category, Player } from '../types';
import { INITIAL_ARTICLES, CLUB_DATABASE } from '../constants';
import { fetchLiveMatches, fetchStandings } from '../services/apiFootball';
import { useSettings } from './SettingsContext';

interface DataContextType {
  articles: Article[];
  addArticle: (article: Article) => boolean;
  updateArticle: (article: Article) => boolean;
  deleteArticle: (id: string) => boolean;
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
  
  const [articles, setArticles] = useLocalStorageState<Article[]>('goolzon_articles', INITIAL_ARTICLES);
  const [clubs, setClubs] = useLocalStorageState<ClubProfile[]>('goolzon_clubs', Object.values(CLUB_DATABASE));
  
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  const addArticle = (article: Article): boolean => {
    setArticles(prev => [article, ...prev]);
    return true;
  };

  const updateArticle = (article: Article): boolean => {
     setArticles(prev => prev.map(a => a.id === article.id ? article : a));
     return true;
  }

  const deleteArticle = (id: string): boolean => {
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

  useEffect(() => {
    const fetchExternalData = async () => {
        setIsLoadingInitial(true);
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
    };
    fetchExternalData();
  }, [apiConfig.keys.matches, apiConfig.leagueIds]);

  const value = {
    articles, addArticle, updateArticle, deleteArticle,
    matches,
    standings,
    clubs, addClub, updateClub, deleteClub, transferPlayer,
    isLoadingInitial
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};