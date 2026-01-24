import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { loadConfig, AppConfig, getSupabase } from './supabase';
import { SupabaseClient } from '@supabase/supabase-js';

interface ConfigContextType {
  config: AppConfig | null;
  loading: boolean;
  supabase: SupabaseClient | null;
}

const ConfigContext = createContext<ConfigContextType>({
  config: null,
  loading: true,
  supabase: null,
});

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  useEffect(() => {
    loadConfig().then((cfg) => {
      setConfig(cfg);
      setSupabase(getSupabase());
      setLoading(false);
    });
  }, []);

  return (
    <ConfigContext.Provider value={{ config, loading, supabase }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useAppConfig() {
  return useContext(ConfigContext);
}
