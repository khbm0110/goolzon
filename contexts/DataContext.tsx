
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Article, Match, Standing, ClubProfile, Sponsor } from '../types';
import { INITIAL_ARTICLES, CLUB_DATABASE } from '../constants';
import { fetchLiveMatches, fetchStandings } from '../services/apiFootball';
import { useSettings } from './SettingsContext';
import { getSupabase } from '../services/supabaseClient';
import { API_FOOTBALL_KEY } from '../config/apiFootballConfig';

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
  deleteSponsor: (id: string) => Promise<boolean>;
  isLoadingInitial: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};

const INITIAL_SPONSORS: Sponsor[] = [
    { id: '1', name: 'طيران الخليج', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e9/Gulf_Air_Logo.svg/1200px-Gulf_Air_Logo.svg.png', url: '#', active: true },
    { id: '2', name: 'stc', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/STC_Logo_2019.svg/1200px-STC_Logo_2019.svg.png', url: '#', active: true },
    { id: '3', name: 'أرامكو', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Aramco_Logo.svg/1200px-Aramco_Logo.svg.png', url: '#', active: true },
];

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { apiConfig } = useSettings();
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [clubs, setClubs] = useState<ClubProfile[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>(INITIAL_SPONSORS);
  
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();
    
    const fetchAllData = async () => {
        setIsLoadingInitial(true);

        if (!supabase) {
            setArticles(INITIAL_ARTICLES);
            setClubs(Object.values(CLUB_DATABASE));
        } else {
            const [articlesRes, clubsRes] = await Promise.all([
                supabase.from('articles').select('*').order('date', { ascending: false }),
                supabase.from('clubs').select('*')
            ]);

            if (articlesRes.error) {
                setArticles(INITIAL_ARTICLES);
            } else {
                setArticles(articlesRes.data);
            }

            if (clubsRes.error) {
                setClubs(Object.values(CLUB_DATABASE));
            } else {
                setClubs(clubsRes.data);
            }
        }

        if (API_FOOTBALL_KEY) {
            try {
                const [liveMatches, leagueStandings] = await Promise.all([
                    fetchLiveMatches(API_FOOTBALL_KEY, apiConfig.leagueIds),
                    fetchStandings(API_FOOTBALL_KEY, apiConfig.leagueIds)
                ]);
                setMatches(liveMatches || []);
                setStandings(leagueStandings || []);
            } catch (e) {
                console.error("API Fetch Error", e);
            }
        }

        setIsLoadingInitial(false);
    };
    
    fetchAllData();
  }, [apiConfig.leagueIds]);

  const addArticle = async (article: Article): Promise<boolean> => {
    const supabase = getSupabase();
    if (!supabase) {
        setArticles(prev => [article, ...prev]);
        return true;
    }
    const { error } = await supabase.from('articles').insert([article]);
    if (error) return false;
    setArticles(prev => [article, ...prev]);
    return true;
  };

  const updateArticle = async (article: Article): Promise<boolean> => {
     const supabase = getSupabase();
     if (!supabase) {
        setArticles(prev => prev.map(a => a.id === article.id ? article : a));
        return true;
     }
     const { error } = await supabase.from('articles').update(article).eq('id', article.id);
     if (error) return false;
     setArticles(prev => prev.map(a => a.id === article.id ? article : a));
     return true;
  }

  const deleteArticle = async (id: string): Promise<boolean> => {
     const supabase = getSupabase();
     if (!supabase) {
        setArticles(prev => prev.filter(a => a.id !== id));
        return true;
     }
     const { error } = await supabase.from('articles').delete().eq('id', id);
     if (error) return false;
     setArticles(prev => prev.filter(a => a.id !== id));
     return true;
  }

  const addClub = async (club: ClubProfile): Promise<boolean> => {
      const supabase = getSupabase();
      if (!supabase) {
          setClubs(prev => [...prev, club]);
          return true;
      }
      const { error } = await supabase.from('clubs').insert([club]);
      if (error) return false;
      setClubs(prev => [...prev, club]);
      return true;
  };

  const updateClub = async (club: ClubProfile): Promise<boolean> => {
      const supabase = getSupabase();
      if (!supabase) {
          setClubs(prev => prev.map(c => c.id === club.id ? club : c));
          return true;
      }
      const { error } = await supabase.from('clubs').update(club).eq('id', club.id);
      if (error) return false;
      setClubs(prev => prev.map(c => c.id === club.id ? club : c));
      return true;
  };

  const deleteClub = async (id: string): Promise<boolean> => {
      const supabase = getSupabase();
      if (!supabase) {
          setClubs(prev => prev.filter(c => c.id !== id));
          return true;
      }
      const { error } = await supabase.from('clubs').delete().eq('id', id);
      if (error) return false;
      setClubs(prev => prev.filter(c => c.id !== id));
      return true;
  };

  const addSponsor = async (sponsor: Sponsor): Promise<boolean> => {
      setSponsors(prev => [...prev, sponsor]);
      return true;
  };

  const deleteSponsor = async (id: string): Promise<boolean> => {
      setSponsors(prev => prev.filter(s => s.id !== id));
      return true;
  };

  const value = {
    articles, addArticle, updateArticle, deleteArticle,
    matches,
    standings,
    clubs, addClub, updateClub, deleteClub,
    sponsors, addSponsor, deleteSponsor,
    isLoadingInitial
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
