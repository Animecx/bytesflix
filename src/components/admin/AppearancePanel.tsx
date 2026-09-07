import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Loader2, Save, RotateCcw, Palette, Image as ImageIcon, Bell,
  UploadCloud, Trash2, Plus, Pencil, X, Check, Power,
} from 'lucide-react';
import { updateSettings, uploadFile, deleteFile, extractStoragePath } from '@/lib/admin';
import { useSettings, applyThemeColorHex, resetThemeColor } from '@/context/SettingsContext';
import { supabase } from '@/lib/supabase';
import { extractErrorMessage } from '@/lib/utils';
import { Modal } from '@/components/Modal';
import { FileUpload } from '@/components/FileUpload';
import type { Popup, PopupFrequency } from '@/types';

const THEME_PRESETS = [
  { name: 'Red', color: '#E50914' },
  { name: 'Blue', color: '#3B82F6' },
  { name: 'Purple', color: '#A855F7' },
  { name: 'Green', color: '#22C55E' },
  { name: 'Orange', color: '#F97316' },
  { name: 'Pink', color: '#EC4899' },
  { name: 'Gold', color: '#F59E0B' },
  { name: 'Cyan', color: '#06B6D4' },
  { name: 'Teal', color: '#14B8A6' },
  { name: 'Indigo', color: '#6366F1' },
  { name: 'Lime', color: '#84CC16' },
  { name: 'Rose', color: '#F43F5E' },
];

const DEFAULT_COLOR = '#E50914';

const WALLPAPER_POSITIONS = ['center', 'top', 'bottom', 'left', 'right', 'top left', 'top right', 'bottom left', 'bottom right'];
const WALLPAPER_SIZES = ['cover', 'contain', 'auto', '100% 100%'];

type SubTab = 'theme' | 'wallpaper' | 'popups';

export function AppearancePanel() {
  const [subTab, setSubTab] = useState<SubTab>('theme');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl space-y-6">
      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-ink-border pb-px">
        {([
          { id: 'theme', label: 'Theme Colors', icon: <Palette className="h-4 w-4" /> },
          { id: 'wallpaper', label: 'Wallpaper', icon: <ImageIcon className="h-4 w-4" /> },
          { id: 'popups', label: 'Custom Popups', icon: <Bell className="h-4 w-4" /> },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              subTab === t.id
                ? 'border-primary text-white'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'theme' && <ThemeSection />}
      {subTab === 'wallpaper' && <WallpaperSection />}
      {subTab === 'popups' && <PopupsSection />}
    </motion.div>
  );
}

// ============================================================
// THEME COLORS
// ============================================================
function ThemeSection() {
  const { settings, refresh } = useSettings();
  const [color, setColor] = useState(settings?.accent_color ?? DEFAULT_COLOR);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (settings?.accent_color) setColor(settings.accent_color);
  }, [settings?.accent_color]);

  // Live preview: apply color immediately to CSS vars
  const applyPreview = useCallback((c: string) => {
    setColor(c);
    applyThemeColorHex(c);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await updateSettings({ accent_color: color });
      await refresh();
      setMessage('Theme color saved successfully.');
    } catch (err) {
      setMessage(extractErrorMessage(err, 'Failed to save theme.'));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    setMessage(null);
    try {
      resetThemeColor();
      setColor(DEFAULT_COLOR);
      await updateSettings({ accent_color: DEFAULT_COLOR });
      await refresh();
      setMessage('Theme reset to default red.');
    } catch (err) {
      setMessage(extractErrorMessage(err, 'Failed to reset theme.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${
          message.includes('Failed') ? 'border-error/30 bg-error/10 text-error' : 'border-success/30 bg-success/10 text-success'
        }`}>
          {message}
        </div>
      )}

      {/* Color picker */}
      <div className="card-surface p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Primary Accent Color</h3>
        <div className="flex flex-wrap items-center gap-4">
          <input
            type="color"
            value={color}
            onChange={(e) => applyPreview(e.target.value)}
            className="h-14 w-20 cursor-pointer rounded-lg border border-ink-border bg-transparent"
          />
          <input
            value={color}
            onChange={(e) => applyPreview(e.target.value)}
            className="input-field flex-1 font-mono"
            placeholder="#E50914"
          />
        </div>

        {/* Presets */}
        <div className="mt-6">
          <p className="mb-3 text-sm font-medium text-neutral-300">Presets</p>
          <div className="flex flex-wrap gap-3">
            {THEME_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreview(preset.color)}
                className={`group flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all ${
                  color.toLowerCase() === preset.color.toLowerCase()
                    ? 'border-white/40 bg-white/10'
                    : 'border-ink-border hover:border-neutral-600'
                }`}
              >
                <span
                  className="h-5 w-5 rounded-full border border-white/20"
                  style={{ backgroundColor: preset.color }}
                />
                <span className="text-neutral-300">{preset.name}</span>
                {color.toLowerCase() === preset.color.toLowerCase() && (
                  <Check className="h-3.5 w-3.5 text-success" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Live preview */}
        <div className="mt-6">
          <p className="mb-3 text-sm font-medium text-neutral-300">Live Preview</p>
          <div className="rounded-xl border border-ink-border bg-ink-soft p-6">
            <div className="flex flex-wrap items-center gap-3">
              <button className="btn-primary">Primary Button</button>
              <button className="btn-outline">Outline Button</button>
              <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary">Badge</span>
              <span className="text-primary">Text Link</span>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-ink-border">
              <div className="h-full w-2/3 rounded-full" style={{ backgroundColor: color }} />
            </div>
            <div className="mt-4 flex gap-2">
              <div className="h-10 flex-1 rounded-lg" style={{ backgroundColor: color, opacity: 0.9 }} />
              <div className="h-10 flex-1 rounded-lg" style={{ backgroundColor: color, opacity: 0.6 }} />
              <div className="h-10 flex-1 rounded-lg" style={{ backgroundColor: color, opacity: 0.3 }} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="h-5 w-5" /> Save Theme</>}
          </button>
          <button onClick={handleReset} disabled={saving} className="btn-outline">
            <RotateCcw className="h-5 w-5" /> Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// WALLPAPER
// ============================================================
function WallpaperSection() {
  const { settings, refresh } = useSettings();
  const [enabled, setEnabled] = useState(settings?.wallpaper_enabled ?? false);
  const [opacity, setOpacity] = useState(settings?.wallpaper_opacity ?? 0.3);
  const [position, setPosition] = useState(settings?.wallpaper_position ?? 'center');
  const [size, setSize] = useState(settings?.wallpaper_size ?? 'cover');
  const [wallpaperUrl, setWallpaperUrl] = useState(settings?.wallpaper_url ?? null);
  const [wallpaperFile, setWallpaperFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setEnabled(settings.wallpaper_enabled);
      setOpacity(settings.wallpaper_opacity);
      setPosition(settings.wallpaper_position);
      setSize(settings.wallpaper_size);
      setWallpaperUrl(settings.wallpaper_url);
    }
  }, [settings]);

  const previewUrl = wallpaperFile ? URL.createObjectURL(wallpaperFile) : wallpaperUrl;

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      let url = wallpaperUrl;
      if (wallpaperFile) {
        const result = await uploadFile('wallpapers', wallpaperFile);
        url = result.publicUrl;
      }
      await updateSettings({
        wallpaper_enabled: enabled,
        wallpaper_opacity: opacity,
        wallpaper_position: position,
        wallpaper_size: size,
        wallpaper_url: url,
      } as Record<string, unknown>);
      await refresh();
      setMessage('Wallpaper settings saved successfully.');
      setWallpaperFile(null);
    } catch (err) {
      setMessage(extractErrorMessage(err, 'Failed to save wallpaper.'));
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setSaving(true);
    setMessage(null);
    try {
      if (wallpaperUrl) {
        const path = extractStoragePath(wallpaperUrl);
        if (path) {
          try { await deleteFile('wallpapers', path); } catch { /* best-effort */ }
        }
      }
      await updateSettings({
        wallpaper_url: null,
        wallpaper_enabled: false,
      } as Record<string, unknown>);
      setWallpaperUrl(null);
      setEnabled(false);
      setWallpaperFile(null);
      await refresh();
      setMessage('Wallpaper removed.');
    } catch (err) {
      setMessage(extractErrorMessage(err, 'Failed to remove wallpaper.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${
          message.includes('Failed') ? 'border-error/30 bg-error/10 text-error' : 'border-success/30 bg-success/10 text-success'
        }`}>
          {message}
        </div>
      )}

      {/* Enable/disable */}
      <div className="card-surface flex items-center justify-between p-5">
        <div>
          <h3 className="text-lg font-semibold text-white">Custom Wallpaper</h3>
          <p className="mt-1 text-sm text-neutral-400">Replace the dark background with a seasonal or event wallpaper.</p>
        </div>
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-6 w-6 accent-primary"
          />
          <span className="text-sm font-medium text-neutral-300">{enabled ? 'Enabled' : 'Disabled'}</span>
        </label>
      </div>

      {/* Upload */}
      <div className="card-surface p-6">
        <h4 className="mb-4 text-sm font-medium text-neutral-300">Wallpaper Image</h4>
        {previewUrl ? (
          <div className="relative overflow-hidden rounded-xl border border-ink-border">
            <div
              className="h-64 w-full bg-ink-soft bg-no-repeat"
              style={{
                backgroundImage: `url(${previewUrl})`,
                backgroundSize: size,
                backgroundPosition: position,
              }}
            />
            <div
              className="absolute inset-0 bg-ink"
              style={{ opacity: 1 - opacity }}
            />
            <button
              onClick={() => { setWallpaperFile(null); setWallpaperUrl(null); }}
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/70 text-white transition-colors hover:bg-black/90"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="absolute bottom-3 left-3 rounded-lg bg-black/70 px-3 py-1 text-xs text-white">
              Preview (opacity {Math.round(opacity * 100)}%)
            </div>
          </div>
        ) : (
          <FileUpload
            label=""
            accept="image/*"
            hint="Upload a wallpaper image (Christmas, Halloween, Diwali, etc.)"
            previewUrl={null}
            previewType="image"
            onFileSelected={(file) => { if (file) setWallpaperFile(file); }}
          />
        )}
      </div>

      {/* Controls */}
      <div className="card-surface space-y-5 p-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-300">
            Background Opacity: {Math.round(opacity * 100)}%
          </label>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <p className="mt-1 text-xs text-neutral-500">Higher = more visible wallpaper. Lower = darker overlay for readability.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-300">Background Position</label>
            <select value={position} onChange={(e) => setPosition(e.target.value)} className="input-field">
              {WALLPAPER_POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-300">Background Size</label>
            <select value={size} onChange={(e) => setSize(e.target.value)} className="input-field">
              {WALLPAPER_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="h-5 w-5" /> Save Wallpaper</>}
        </button>
        {wallpaperUrl && (
          <button onClick={handleRemove} disabled={saving} className="btn-outline !border-error/30 text-error hover:bg-error/10">
            <Trash2 className="h-5 w-5" /> Remove Wallpaper
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// CUSTOM POPUPS
// ============================================================
function PopupsSection() {
  const { settings, popups, refresh } = useSettings();
  const [masterEnabled, setMasterEnabled] = useState(settings?.popups_enabled ?? false);
  const [showForm, setShowForm] = useState(false);
  const [editingPopup, setEditingPopup] = useState<Popup | null>(null);
  const [savingMaster, setSavingMaster] = useState(false);

  useEffect(() => {
    if (settings) setMasterEnabled(settings.popups_enabled);
  }, [settings]);

  const handleToggleMaster = async () => {
    setSavingMaster(true);
    try {
      await updateSettings({ popups_enabled: !masterEnabled } as Record<string, unknown>);
      setMasterEnabled(!masterEnabled);
      await refresh();
    } catch {
      // ignore
    } finally {
      setSavingMaster(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this popup?')) return;
    try {
      const { error } = await supabase.from('popups').delete().eq('id', id);
      if (error) throw error;
      await refresh();
    } catch (err) {
      alert(extractErrorMessage(err, 'Failed to delete popup.'));
    }
  };

  const handleTogglePopup = async (popup: Popup) => {
    try {
      const { error } = await supabase.from('popups').update({ is_enabled: !popup.is_enabled }).eq('id', popup.id);
      if (error) throw error;
      await refresh();
    } catch (err) {
      alert(extractErrorMessage(err, 'Failed to toggle popup.'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Master switch */}
      <div className="card-surface flex items-center justify-between p-5">
        <div>
          <h3 className="text-lg font-semibold text-white">Custom Popups</h3>
          <p className="mt-1 text-sm text-neutral-400">Create announcement popups for seasonal events, promotions, or notices.</p>
        </div>
        <div className="flex items-center gap-3">
          {savingMaster && <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />}
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={masterEnabled}
              onChange={handleToggleMaster}
              className="h-6 w-6 accent-primary"
            />
            <span className="text-sm font-medium text-neutral-300">{masterEnabled ? 'Popups ON' : 'Popups OFF'}</span>
          </label>
        </div>
      </div>

      {/* New popup button */}
      <button
        onClick={() => { setEditingPopup(null); setShowForm(true); }}
        className="btn-primary"
      >
        <Plus className="h-5 w-5" /> Create Popup
      </button>

      {/* Popup list */}
      {popups.length === 0 ? (
        <div className="card-surface p-8 text-center">
          <Bell className="mx-auto h-10 w-10 text-neutral-600" />
          <p className="mt-3 text-sm text-neutral-400">No popups created yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {popups.map((popup) => (
            <div key={popup.id} className="card-surface flex items-center gap-4 p-4">
              {/* Image thumbnail */}
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-ink-border">
                {popup.image_url ? (
                  <img src={popup.image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Bell className="h-5 w-5 text-neutral-600" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <h4 className="line-clamp-1 text-sm font-semibold text-white">{popup.title}</h4>
                <p className="line-clamp-1 text-xs text-neutral-400">{popup.message ?? 'No message'}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  <span className={`rounded-full px-2 py-0.5 font-semibold ${
                    popup.is_enabled ? 'bg-success/20 text-success' : 'bg-neutral-700 text-neutral-400'
                  }`}>
                    {popup.is_enabled ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-neutral-500">Shows: {popup.display_frequency}</span>
                  {popup.button_text && <span className="text-neutral-500">Button: "{popup.button_text}"</span>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => handleTogglePopup(popup)}
                  className={`grid h-9 w-9 place-items-center rounded-lg transition-colors ${
                    popup.is_enabled
                      ? 'bg-success/10 text-success hover:bg-success/20'
                      : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                  }`}
                  title={popup.is_enabled ? 'Disable' : 'Enable'}
                >
                  <Power className="h-4 w-4" />
                </button>
                <button
                  onClick={() => { setEditingPopup(popup); setShowForm(true); }}
                  className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 text-neutral-300 transition-colors hover:bg-white/10"
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(popup.id)}
                  className="grid h-9 w-9 place-items-center rounded-lg bg-error/10 text-error transition-colors hover:bg-error/20"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <PopupForm
          popup={editingPopup}
          onClose={() => { setShowForm(false); setEditingPopup(null); }}
          onSaved={() => { setShowForm(false); setEditingPopup(null); refresh(); }}
        />
      )}
    </div>
  );
}

// ============================================================
// POPUP FORM
// ============================================================
function PopupForm({ popup, onClose, onSaved }: { popup: Popup | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!popup;
  const [title, setTitle] = useState(popup?.title ?? '');
  const [message, setMessage] = useState(popup?.message ?? '');
  const [buttonText, setButtonText] = useState(popup?.button_text ?? '');
  const [buttonUrl, setButtonUrl] = useState(popup?.button_url ?? '');
  const [frequency, setFrequency] = useState<PopupFrequency>(popup?.display_frequency ?? 'once');
  const [enabled, setEnabled] = useState(popup?.is_enabled ?? true);
  const [imageSlot, setImageSlot] = useState<{ file: File | null; previewUrl: string | null }>({
    file: null,
    previewUrl: popup?.image_url ?? null,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError('Popup title is required.');
      return;
    }
    setSaving(true);
    try {
      let imageUrl = imageSlot.previewUrl;
      if (imageSlot.file) {
        const result = await uploadFile('wallpapers', imageSlot.file);
        imageUrl = result.publicUrl;
      }

      const payload = {
        title: title.trim(),
        message: message.trim() || null,
        image_url: imageUrl,
        button_text: buttonText.trim() || null,
        button_url: buttonUrl.trim() || null,
        display_frequency: frequency,
        is_enabled: enabled,
      };

      if (isEdit && popup) {
        const { error: err } = await supabase.from('popups').update(payload).eq('id', popup.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from('popups').insert(payload);
        if (err) throw err;
      }

      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to save popup.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Edit Popup' : 'Create Popup'} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
            <X className="h-4 w-4" /> {error}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-300">Popup Title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="e.g. Christmas Special!" required />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-300">Message</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="input-field resize-none" placeholder="Merry Christmas from BytesFlix!" />
        </div>

        <FileUpload
          label="Popup Image (optional)"
          accept="image/*"
          hint="Christmas artwork, event banner, etc."
          previewUrl={imageSlot.previewUrl}
          previewType="image"
          onFileSelected={(file) => {
            if (file) {
              setImageSlot({ file, previewUrl: URL.createObjectURL(file) });
            } else {
              setImageSlot({ file: null, previewUrl: null });
            }
          }}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-300">Button Text (optional)</label>
            <input value={buttonText} onChange={(e) => setButtonText(e.target.value)} className="input-field" placeholder="Explore Now" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-300">Button URL (optional)</label>
            <input value={buttonUrl} onChange={(e) => setButtonUrl(e.target.value)} className="input-field" placeholder="https://..." />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-300">Display Frequency</label>
            <select value={frequency} onChange={(e) => setFrequency(e.target.value as PopupFrequency)} className="input-field">
              <option value="once">Show once (per browser)</option>
              <option value="session">Show once per session</option>
              <option value="always">Show every visit</option>
            </select>
          </div>
          <label className="flex cursor-pointer items-center gap-3 self-end">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-5 w-5 accent-primary" />
            <span className="text-sm text-neutral-300">Enabled</span>
          </label>
        </div>

        {/* Preview */}
        <div className="rounded-xl border border-ink-border bg-ink-soft p-4">
          <p className="mb-2 text-xs font-medium text-neutral-500">Live Preview</p>
          <div className="rounded-lg border border-ink-border bg-ink-card p-4">
            {imageSlot.previewUrl && (
              <img src={imageSlot.previewUrl} alt="" className="mb-3 max-h-32 w-full rounded-lg object-cover" />
            )}
            <h4 className="text-lg font-bold text-white">{title || 'Popup Title'}</h4>
            {message && <p className="mt-1 text-sm text-neutral-300">{message}</p>}
            {buttonText && (
              <button type="button" className="btn-primary mt-3 !px-4 !py-2 text-sm">
                {buttonText}
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="h-5 w-5" /> {isEdit ? 'Save Changes' : 'Create Popup'}</>}
          </button>
          <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
        </div>
      </form>
    </Modal>
  );
}
