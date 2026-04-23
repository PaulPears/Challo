import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import api from '../config/api';
import packageJson from '../../package.json';

interface AppConfig {
  min_driver_app_version: string;
  min_rider_app_version: string;
  latest_driver_app_version: string;
  privacy_policy_driver: string;
  terms_and_conditions_driver: string;
  support_contact_whatsapp: string;
  [key: string]: any;
}

interface ConfigContextType {
  config: AppConfig | null;
  isLoading: boolean;
  version: string;
  isOutdated: boolean;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const version = packageJson.version;

  const fetchConfig = async () => {
    try {
      const response = await api.get('/config/app');
      setConfig(response.data);
    } catch (error) {
      console.error('[Config] Failed to fetch app config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const isOutdated = React.useMemo(() => {
    if (!config || !config.min_driver_app_version) return false;
    
    const min = config.min_driver_app_version.split('.').map(Number);
    const curr = version.split('.').map(Number);
    
    for (let i = 0; i < 3; i++) {
      if (curr[i] > min[i]) return false;
      if (curr[i] < min[i]) return true;
    }
    return false;
  }, [config, version]);

  return (
    <ConfigContext.Provider value={{ config, isLoading, version, isOutdated }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useAppConfig = () => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useAppConfig must be used within a ConfigProvider');
  }
  return context;
};
