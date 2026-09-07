import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { SiteSettings, Popup } from '@/types';

interface SettingsContextValue {
  settings: SiteSettings | null;
  popups: Popup[];
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
  wallpaper_url: null,
  wallpaper_enabled: false,
  wallpaper_opacity: 0.3,
  wallpaper_position: 'center',
  wallpaper_size: 'cover',
  popups_enabled: false,
};

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace('#', '');
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return [r, g, b];
}

function clamp(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function shadeRgb(r: number, g: number, b: number, amount: number): string {
  return `${clamp(r + amount)} ${clamp(g + amount)} ${clamp(b + amount)}`;
}

function applyThemeColor(color: string) {
  const [r, g, b] = hexToRgb(color);
  const root = document.documentElement;
  root.style.setProperty('--color-primary-rgb', `${r} ${g} ${b}`);
  root.style.setProperty('--color-primary-50-rgb', shadeRgb(r, g, b, 180));
  root.style.setProperty('--color-primary-100-rgb', shadeRgb(r, g, b, 140));
  root.style.setProperty('--color-primary-200-rgb', shadeRgb(r, g, b, 100));
  root.style.setProperty('--color-primary-300-rgb', shadeRgb(r, g, b, 60));
  root.style.setProperty('--color-primary-400-rgb', shadeRgb(r, g, b, 20));
  root.style.setProperty('--color-primary-500-rgb', `${r} ${g} ${b}`);
  root.style.setProperty('--color-primary-600-rgb', shadeRgb(r, g, b, -20));
  root.style.setProperty('--color-primary-700-rgb', shadeRgb(r, g, b, -40));
  root.style.setProperty('--color-primary-800-rgb', shadeRgb(r, g, b, -60));
  root.style.setProperty('--color-primary-900-rgb', shadeRgb(r, g, b, -80));
}

export function applyThemeColorHex(color: string) {
  applyThemeColor(color);
}

export function resetThemeColor() {
  applyThemeColor('#E50914');
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const [settingsRes, popupsRes] = await Promise.all([
      supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('popups').select('*').order('created_at', { ascending: false }),
    ]);
    if (settingsRes.error || !settingsRes.data) {
      setSettings(DEFAULT_SETTINGS);
    } else {
      setSettings(settingsRes.data as SiteSettings);
    }
    if (!popupsRes.error && popupsRes.data) {
      setPopups(popupsRes.data as Popup[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (settings?.accent_color) {
      applyThemeColor(settings.accent_color);
    }
  }, [settings?.accent_color]);

  return (
    <SettingsContext.Provider value={{ settings, popups, loading, refresh }}>
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
