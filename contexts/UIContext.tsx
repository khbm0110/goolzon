
import React, { createContext, useState, useEffect, useContext, ReactNode, useRef } from 'react';
import { Match, Article, Category } from '../types';
import { useSettings } from './SettingsContext';
import { useData } from './DataContext';
import { generateArticleContent } from '../services/geminiService';

const AUTOPILOT_INTERVAL = 300000;

interface UIContextType {
  selectedMatch: Match | null;
  setSelectedMatch: (match: Match | null) => void;
  isAutopilot: boolean;
  toggleAutopilot: () => void;
  isAIGenerating: boolean;
  lastAIUpdate: Date | null;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used within a UIProvider');
  return context;
};

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { featureFlags, apiConfig } = useSettings();
  const { articles, addArticle } = useData();
  
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isAutopilot, setIsAutopilot] = useState(featureFlags.autopilot);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [lastAIUpdate, setLastAIUpdate] = useState<Date | null>(null);

  const autopilotIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const toggleAutopilot = () => {
    setIsAutopilot(prev => !prev);
  };

  useEffect(() => {
    if (!isAutopilot || !featureFlags.autopilot) {
        if (autopilotIntervalRef.current) clearInterval(autopilotIntervalRef.current);
        return;
    }

    const runAutopilot = async () => {
       setIsAIGenerating(true);
       try {
           const trendingTopics = [
             'الدوري السعودي', 'الهلال', 'النصر', 'كريستيانو رونالدو', 
             'الدوري الإماراتي', 'العين', 'السد القطري', 'المنتخب السعودي'
           ];
           const randomTopic = trendingTopics[Math.floor(Math.random() * trendingTopics.length)];
           
           const newArticleContent = await generateArticleContent(randomTopic, apiConfig.keys.gemini);
           if (newArticleContent && !articles.some(a => a.title === newArticleContent.title)) {
             const categoryValues = Object.values(Category) as string[];
             const safeCategory = categoryValues.includes(newArticleContent.category)
               ? newArticleContent.category as Category
               : Category.SAUDI;

             const newArticle: Article = {
                 id: Date.now().toString(),
                 ...newArticleContent,
                 category: safeCategory,
                 date: new Date().toISOString(),
                 views: 0,
                 author: 'AI Reporter'
             };
             await addArticle(newArticle);
           }
       } catch (e) {
           console.error("Autopilot Error:", e);
       } finally {
           setIsAIGenerating(false);
           setLastAIUpdate(new Date());
       }
    };
    
    autopilotIntervalRef.current = setInterval(runAutopilot, AUTOPILOT_INTERVAL);
    return () => {
        if (autopilotIntervalRef.current) clearInterval(autopilotIntervalRef.current);
    };
  }, [isAutopilot, featureFlags.autopilot, apiConfig.keys.gemini, articles, addArticle]);

  const value = {
      selectedMatch, setSelectedMatch,
      isAutopilot, toggleAutopilot,
      isAIGenerating, lastAIUpdate
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};
