import { useSettings } from '@/context/SettingsContext';

export function WallpaperBackground() {
  const { settings } = useSettings();

  if (!settings?.wallpaper_enabled || !settings?.wallpaper_url) return null;

  return (
    <div
      className="fixed inset-0 -z-10 bg-ink"
      aria-hidden
    >
      <div
        className="absolute inset-0 bg-no-repeat"
        style={{
          backgroundImage: `url(${settings.wallpaper_url})`,
          backgroundSize: settings.wallpaper_size,
          backgroundPosition: settings.wallpaper_position,
        }}
      />
      <div
        className="absolute inset-0 bg-ink"
        style={{ opacity: 1 - settings.wallpaper_opacity }}
      />
    </div>
  );
}
