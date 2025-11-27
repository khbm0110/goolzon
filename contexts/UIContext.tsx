
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Match } from '../types';

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
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isAutopilot, setIsAutopilot] = useState(true);
  const [isAIGenerating] = useState(false); // Kept for interface compatibility but unused
  const [lastAIUpdate] = useState<Date | null>(null);

  const toggleAutopilot = () => {
    setIsAutopilot(prev => !prev);
  };

  const value = {
      selectedMatch, setSelectedMatch,
      isAutopilot, toggleAutopilot,
      isAIGenerating, lastAIUpdate
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};
