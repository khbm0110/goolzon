import React, { createContext, useState, useEffect, useContext, ReactNode, useRef } from 'react';
import { Match, Article, Category } from '../types';
import { useSettings } from './SettingsContext';
import { useData } from './DataContext';
import { generateArticleContent } from '../services/geminiService';

const AUTOPILOT_INTERVAL = 300000; // 5 Minutes

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
  // Local state for "Pause/Resume" - defaults to true if feature is enabled
  const [isAutopilot, setIsAutopilot] = useState(true);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [lastAIUpdate, setLastAIUpdate] = useState<Date | null>(null);

  const autopilotIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const toggleAutopilot = () => {
    setIsAutopilot(prev => !prev);
  };

  // Effect to handle Autopilot Logic
  useEffect(() => {
    // 1. Check if Master Switch (Admin) is OFF OR Local Switch (Header) is OFF
    if (!featureFlags.autopilot || !isAutopilot) {
        if (autopilotIntervalRef.current) {
            console.log("AI Autopilot: Stopped (Disabled by Admin or User)");
            clearInterval(autopilotIntervalRef.current);
            autopilotIntervalRef.current = null;
        }
        return;
    }

    // 2. Check for API Key
    if (!apiConfig.keys.gemini) {
        console.warn("AI Autopilot: Paused (No Gemini API Key provided in Admin Dashboard)");
        return;
    }

    console.log("AI Autopilot: Active and Running...");

    const runAutopilot = async () => {
       if (isAIGenerating) return; // Prevent overlapping runs

       setIsAIGenerating(true);
       try {
           const trendingTopics = [
             'الدوري السعودي', 'الهلال', 'النصر', 'كريستيانو رونالدو', 
             'الدوري الإماراتي', 'العين', 'السد القطري', 'المنتخب السعودي',
             'دوري أبطال آسيا', 'انتقالات اللاعبين الخليج', 'الاتحاد السعودي'
           ];
           const randomTopic = trendingTopics[Math.floor(Math.random() * trendingTopics.length)];
           
           console.log(`AI Autopilot: Generating content about ${randomTopic}...`);
           
           const newArticleContent = await generateArticleContent(randomTopic, apiConfig.keys.gemini);
           
           if (newArticleContent) {
             // Check for duplicates
             const isDuplicate = articles.some(a => 
                 a.title === newArticleContent.title || 
                 (newArticleContent.title.includes(a.title.substring(0, 20)))
             );

             if (!isDuplicate) {
                 const categoryValues = Object.values(Category) as string[];
                 const safeCategory = categoryValues.includes(newArticleContent.category)
                   ? newArticleContent.category as Category
                   : Category.SAUDI;

                 const newArticle: Article = {
                     id: `ai-${Date.now()}`,
                     title: newArticleContent.title,
                     summary: newArticleContent.summary,
                     content: newArticleContent.content,
                     imageUrl: newArticleContent.imageUrl,
                     sources: newArticleContent.sources,
                     category: safeCategory,
                     date: new Date().toISOString(),
                     author: 'AI Reporter 🤖',
                     views: 1,
                     isBreaking: newArticleContent.hasNews,
                 };
                 
                 const success = await addArticle(newArticle);
                 if (success) {
                    console.log("AI Autopilot: Article published successfully!");
                    setLastAIUpdate(new Date());
                 }
             } else {
                 console.log("AI Autopilot: Duplicate content detected, skipping.");
             }
           }
       } catch (e) {
           console.error("Autopilot Error:", e);
       } finally {
           setIsAIGenerating(false);
       }
    };
    
    // Run immediately on first enable (if not too soon)
    if (!lastAIUpdate) {
        runAutopilot();
    }
    
    // Set Interval
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