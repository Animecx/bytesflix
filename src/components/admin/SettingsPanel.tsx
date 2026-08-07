import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Save, Check, UploadCloud } from 'lucide-react';
import { updateSettings, uploadFile } from '@/lib/admin';
import { useSettings } from '@/context/SettingsContext';
import { supabase } from '@/lib/supabase';

export function SettingsPanel() {
  const { settings, refresh } = useSettings();
  const [siteName, setSiteName] = useState(settings?.site_name ?? 'BytesFlix');
  const [accentColor, setAccentColor] = useState(settings?.accent_color ?? '#E50914');
  const [maintenanceMode, setMaintenanceMode] = useState(settings?.maintenance_mode ?? false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setSiteName(settings.site_name);
      setAccentColor(settings.accent_color);
      setMaintenanceMode(settings.maintenance_mode);
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      let logoUrl = settings?.logo_url;
      let bannerUrl = settings?.hero_banner_url;

      if (logoFile) {
        const result = await uploadFile('banners', logoFile);
        logoUrl = result.publicUrl;
      }
      if (bannerFile) {
        const result = await uploadFile('banners', bannerFile);
        bannerUrl = result.publicUrl;
      }

      await updateSettings({
        site_name: siteName,
        accent_color: accentColor,
        maintenance_mode: maintenanceMode,
        logo_url: logoUrl,
        hero_banner_url: bannerUrl,
      });

      await refresh();
      setMessage('Settings saved successfully.');
      setLogoFile(null);
      setBannerFile(null);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onSubmit={handleSave}
      className="max-w-2xl space-y-6"
    >
      {message && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${
          message.includes('Failed') ? 'border-error/30 bg-error/10 text-error' : 'border-success/30 bg-success/10 text-success'
        }`}>
          {message}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-300">Site Name</label>
        <input value={siteName} onChange={(e) => setSiteName(e.target.value)} className="input-field" />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-300">Accent Color</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            className="h-12 w-16 cursor-pointer rounded-lg border border-ink-border bg-transparent"
          />
          <input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="input-field flex-1" />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-300">Logo Image</label>
        <div className="flex items-center gap-3">
          {settings?.logo_url && (
            <img src={settings.logo_url} alt="Logo" className="h-12 w-auto rounded-lg border border-ink-border" />
          )}
          <label className="flex-1 cursor-pointer rounded-xl border-2 border-dashed border-ink-border p-4 text-center transition-colors hover:border-neutral-600">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} />
            <UploadCloud className="mx-auto h-6 w-6 text-neutral-500" />
            <p className="mt-1 text-xs text-neutral-400">{logoFile ? logoFile.name : 'Click to upload logo'}</p>
          </label>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-300">Homepage Banner</label>
        <div className="flex items-center gap-3">
          {settings?.hero_banner_url && (
            <img src={settings.hero_banner_url} alt="Banner" className="h-16 w-28 rounded-lg border border-ink-border object-cover" />
          )}
          <label className="flex-1 cursor-pointer rounded-xl border-2 border-dashed border-ink-border p-4 text-center transition-colors hover:border-neutral-600">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setBannerFile(e.target.files?.[0] ?? null)} />
            <UploadCloud className="mx-auto h-6 w-6 text-neutral-500" />
            <p className="mt-1 text-xs text-neutral-400">{bannerFile ? bannerFile.name : 'Click to upload banner'}</p>
          </label>
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={maintenanceMode}
          onChange={(e) => setMaintenanceMode(e.target.checked)}
          className="h-5 w-5 accent-primary"
        />
        <div>
          <span className="text-sm font-medium text-neutral-300">Maintenance Mode</span>
          <p className="text-xs text-neutral-500">When enabled, the site shows a maintenance notice to visitors.</p>
        </div>
      </label>

      <button type="submit" disabled={saving} className="btn-primary">
        {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="h-5 w-5" /> Save Settings</>}
      </button>
    </motion.form>
  );
}
