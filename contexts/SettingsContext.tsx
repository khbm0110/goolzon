import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { FeatureFlags, ApiConfig } from '../types';
import { getSupabase } from '../services/supabaseClient';

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
    leagueIds: '307, 39, 140, 2, 135, 78, 301', // SA, EPL, LIGA, UCL, SERIEA, BUND, UAE
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
  const [bootstrapConfig, setBootstrapConfig] = useState(() => {
    const saved = localStorage.getItem('goolzon_api_config_bootstrap');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { supabaseUrl: parsed.supabaseUrl || '', supabaseKey: parsed.supabaseKey || '' };
    }
    return { supabaseUrl: '', supabaseKey: '' };
  });

  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(INITIAL_FLAGS);
  const [apiConfig, setApiConfigState] = useState<ApiConfig>(INITIAL_API_CONFIG);

  useEffect(() => {
    const fetchSettings = async () => {
      const supabase = getSupabase(bootstrapConfig.supabaseUrl, bootstrapConfig.supabaseKey);
      if (supabase) {
        const { data, error } = await supabase.from('settings').select('*').eq('id', 1).single();

        if (error && error.code !== 'PGRST116') { // PGRST116: no rows found
          console.error("Error fetching settings:", error);
        }

        if (data) {
          setFeatureFlags({ ...INITIAL_FLAGS, ...(data.feature_flags || {}) });
          setApiConfigState({ ...INITIAL_API_CONFIG, ...(data.api_config || {}) });
        } else {
          console.warn("No settings found in DB. Using initial defaults.");
          setFeatureFlags(INITIAL_FLAGS);
          setApiConfigState(INITIAL_API_CONFIG);
        }
      } else {
        // Fallback to localStorage if Supabase is not configured
        const savedFeatures = localStorage.getItem('goolzon_features');
        const savedApi = localStorage.getItem('goolzon_api_config');
        setFeatureFlags(savedFeatures ? { ...INITIAL_FLAGS, ...JSON.parse(savedFeatures) } : INITIAL_FLAGS);
        setApiConfigState(savedApi ? { ...INITIAL_API_CONFIG, ...JSON.parse(savedApi) } : INITIAL_API_CONFIG);
      }
    };
    fetchSettings();
  }, [bootstrapConfig.supabaseUrl, bootstrapConfig.supabaseKey]);

  const setApiConfig = (config: ApiConfig) => {
    setApiConfigState(config);
    setBootstrapConfig({ supabaseUrl: config.supabaseUrl, supabaseKey: config.supabaseKey });
    
    // Persist bootstrap keys to a separate localStorage item
    localStorage.setItem('goolzon_api_config_bootstrap', JSON.stringify({ supabaseUrl: config.supabaseUrl, supabaseKey: config.supabaseKey }));
    
    // Also save full config to old key as a fallback
    localStorage.setItem('goolzon_api_config', JSON.stringify(config));

    const supabase = getSupabase(config.supabaseUrl, config.supabaseKey);
    if (supabase) {
      const { supabaseUrl, supabaseKey, ...restOfConfig } = config;
      supabase.from('settings').upsert({
        id: 1,
        api_config: restOfConfig,
        feature_flags: featureFlags // Also save current flags
      }).then(({ error }) => {
        if (error) console.error("Failed to save API config to DB:", error);
      });
    }
  };

  const setFeatureFlag = (key: keyof FeatureFlags, value: boolean) => {
    const newFlags = { ...featureFlags, [key]: value };
    setFeatureFlags(newFlags);

    localStorage.setItem('goolzon_features', JSON.stringify(newFlags));

    const supabase = getSupabase(bootstrapConfig.supabaseUrl, bootstrapConfig.supabaseKey);
    if (supabase) {
      // FIX: Destructuring from a combined object literal can confuse TypeScript's type inference.
      // Create an intermediate variable to ensure the type is correctly inferred before destructuring.
      const fullConfig = { ...apiConfig, ...bootstrapConfig };
      const { supabaseUrl, supabaseKey, ...restOfConfig } = fullConfig;
      supabase.from('settings').upsert({
        id: 1,
        feature_flags: newFlags,
        api_config: restOfConfig // Also save current api config
      }).then(({ error }) => {
        if (error) console.error("Failed to save feature flags to DB:", error);
      });
    }
  };

  // The final config object is a merge of the DB-backed config and the live bootstrap keys
  const finalApiConfig = { ...apiConfig, ...bootstrapConfig };

  const value = { featureFlags, setFeatureFlag, apiConfig: finalApiConfig, setApiConfig };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};
