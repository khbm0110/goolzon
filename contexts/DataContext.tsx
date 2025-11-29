import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Article, Match, Standing, ClubProfile, Sponsor } from '../types';
import { INITIAL_ARTICLES, CLUB_DATABASE } from '../constants';
import { fetchLiveMatches, fetchStandings } from '../services/apiFootball';
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
  sponsors: Sponsor[];
  addSponsor: (sponsor: Sponsor) => Promise<boolean>;
  updateSponsor: (sponsor: Sponsor) => Promise<boolean>;
  deleteSponsor: (id: string) => Promise<boolean>;
  isLoadingInitial: boolean;
  // Removed Supabase-specific functions like users, settings, comments, analytics
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
  
  const [articles, setArticles] = useState<Article[]>(INITIAL_ARTICLES);
  const [clubs, setClubs] = useState<ClubProfile[]>(Object.values(CLUB_DATABASE));
  const [sponsors, setSponsors] = useState<Sponsor[]>(INITIAL_SPONSORS);
  
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  useEffect(() => {
    const loadApiData = async () => {
        setIsLoadingInitial(true);
        const [fetchedMatches, fetchedStandings] = await Promise.all([
          fetchLiveMatches('', apiConfig.leagueIds), // API key is mock, leagues are relevant
          fetchStandings('', apiConfig.leagueIds)
        ]);
        setMatches(fetchedMatches);
        setStandings(fetchedStandings);
        setIsLoadingInitial(false);
    };
    
    loadApiData();
    // No interval for mock data
  }, [apiConfig.leagueIds]);

  // --- Mock Handlers ---
  const addArticle = async (article: Article): Promise<boolean> => { 
    setArticles(prev => [article, ...prev]);
    return true; 
  };
  const updateArticle = async (article: Article): Promise<boolean> => { 
    setArticles(prev => prev.map(a => a.id === article.id ? article : a));
    return true; 
  };
  const deleteArticle = async (id: string): Promise<boolean> => { 
    setArticles(prev => prev.filter(a => a.id !== id));
    return true; 
  };

  const addClub = async (club: ClubProfile): Promise<boolean> => { 
    setClubs(prev => [...prev, club]);
    return true; 
  };
  const updateClub = async (club: ClubProfile): Promise<boolean> => { 
    setClubs(prev => prev.map(c => c.id === club.id ? club : c));
    return true; 
  };
  const deleteClub = async (id: string): Promise<boolean> => { 
    setClubs(prev => prev.filter(c => c.id !== id));
    return true; 
  };

  const addSponsor = async (sponsor: Sponsor): Promise<boolean> => { 
    setSponsors(prev => [...prev, sponsor]);
    return true; 
  };
  const updateSponsor = async (sponsor: Sponsor): Promise<boolean> => { 
    setSponsors(prev => prev.map(s => s.id === sponsor.id ? sponsor : s));
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
    sponsors, addSponsor, updateSponsor, deleteSponsor,
    isLoadingInitial,
    // Mock implementations for functions that are now removed but might be called in Admin panel
    users: [], updateUser: async () => false, deleteUser: async () => false, addUser: async () => null,
    seoSettings: null, updateSeoSettings: async () => false,
    adSettings: null, updateAdSettings: async () => false,
    comments: [], addComment: async () => null, updateCommentStatus: async () => false,
    analyticsData: null,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};