import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { SiteSettings } from '@/types';

interface SettingsContextValue {
  settings: SiteSettings | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

const DEFAULT_SETTINGS: SiteSettings = {
  id: 1,
  site_name: 'BytesFlix',
  logo_url: null,
  hero_banner_url: null,
  accent_color: '#E50914',
  maintenance_mode: false,
  updated_at: new Date().toISOString(),
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const { data, error } = await supabase.from('settings').select('*').eq('id', 1).maybeSingle();
    if (error || !data) {
      setSettings(DEFAULT_SETTINGS);
    } else {
      setSettings(data as SiteSettings);
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, refresh }}>
      {children}
    </SettingsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
