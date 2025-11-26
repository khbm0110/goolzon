
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { FeatureFlags, ApiConfig } from '../types';

const INITIAL_FLAGS: FeatureFlags = {
    matches: true,
    clubs: true,
    mercato: true,
    videos: true,
    analysis: true,
    autopilot: true
};

const INITIAL_API_CONFIG: ApiConfig = {
    provider: 'api-football',
    leagueIds: '307, 301, 306, 312, 315, 318',
    autoSync: false,
    supabaseUrl: '',
    supabaseKey: '',
    keys: {
        matches: '',
        results: '',
        playersData: '',
        scouting: '',
        gemini: ''
    }
};

interface SettingsContextType {
  featureFlags: FeatureFlags;
  setFeatureFlag: (key: keyof FeatureFlags, value: boolean) => void;
  apiConfig: ApiConfig;
  setApiConfig: (config: ApiConfig) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(() => {
      const saved = localStorage.getItem('gs_features');
      return saved ? { ...INITIAL_FLAGS, ...JSON.parse(saved) } : INITIAL_FLAGS;
  });

  const [apiConfig, setApiConfigState] = useState<ApiConfig>(() => {
      const saved = localStorage.getItem('gs_api_config');
      return saved ? { ...INITIAL_API_CONFIG, ...JSON.parse(saved) } : INITIAL_API_CONFIG;
  });

  const setFeatureFlag = (key: keyof FeatureFlags, value: boolean) => {
      setFeatureFlags(prev => {
          const next = { ...prev, [key]: value };
          localStorage.setItem('gs_features', JSON.stringify(next));
          return next;
      });
  };

  const setApiConfig = (config: ApiConfig) => {
      setApiConfigState(config);
      localStorage.setItem('gs_api_config', JSON.stringify(config));
  };

  const value = { featureFlags, setFeatureFlag, apiConfig, setApiConfig };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};
