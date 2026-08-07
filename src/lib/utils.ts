import { supabase } from './supabase';

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M views`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K views`;
  return `${views} views`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatSeconds(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = Math.floor(total % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export type VideoProvider =
  | 'youtube'
  | 'vimeo'
  | 'dailymotion'
  | 'streamable'
  | 'loom'
  | 'wistia'
  | 'screenapp'
  | 'hls'
  | 'direct'
  | 'generic'
  | 'unknown';

export interface VideoSourceInfo {
  provider: VideoProvider;
  embedUrl: string | null;
  id: string | null;
}

export function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export function isYouTubeUrl(url: string): boolean {
  return getYouTubeId(url) !== null;
}

function getVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

function getDailymotionId(url: string): string | null {
  const m = url.match(/dailymotion\.com\/(?:video\/|embed\/video\/|swf\/video\/|swf\/)([a-zA-Z0-9]+)/) ?? url.match(/dai\.ly\/([a-zA-Z0-9]+)/);
  return m ? m[1] : null;
}

function getStreamableId(url: string): string | null {
  const m = url.match(/streamable\.com\/(?:e\/)?([a-zA-Z0-9]+)/);
  return m ? m[1] : null;
}

function getLoomId(url: string): string | null {
  const m = url.match(/loom\.com\/share\/([a-f0-9-]+)/);
  return m ? m[1] : null;
}

function getWistiaId(url: string): string | null {
  const m = url.match(/(?:wistia\.com\/medias\/|wistia\.net\/embed\/iframe\/)([a-zA-Z0-9]+)/);
  return m ? m[1] : null;
}

function getScreenappId(url: string): string | null {
  const m = url.match(/screenapp\.io\/app\/v\/([A-Za-z0-9]+)/);
  return m ? m[1] : null;
}

function isHlsUrl(url: string): boolean {
  return /\.m3u8(\?.*)?$/i.test(url);
}

function isDirectVideoUrl(url: string): boolean {
  return /\.(mp4|webm)(\?.*)?$/i.test(url);
}

function isEmbeddableUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function detectVideoProvider(url: string): VideoProvider {
  const u = url.trim().toLowerCase();
  if (getYouTubeId(u)) return 'youtube';
  if (getVimeoId(u)) return 'vimeo';
  if (getDailymotionId(u)) return 'dailymotion';
  if (getStreamableId(u)) return 'streamable';
  if (getLoomId(u)) return 'loom';
  if (getWistiaId(u)) return 'wistia';
  if (getScreenappId(u)) return 'screenapp';
  if (isHlsUrl(u)) return 'hls';
  if (isDirectVideoUrl(u)) return 'direct';
  if (isEmbeddableUrl(url.trim())) return 'generic';
  return 'unknown';
}

export function getVideoSourceInfo(url: string): VideoSourceInfo {
  const provider = detectVideoProvider(url);
  const u = url.trim();

  switch (provider) {
    case 'youtube':
      return { provider, id: getYouTubeId(u), embedUrl: `https://www.youtube.com/embed/${getYouTubeId(u)}` };
    case 'vimeo': {
      const id = getVimeoId(u);
      return { provider, id, embedUrl: id ? `https://player.vimeo.com/video/${id}` : null };
    }
    case 'dailymotion': {
      const id = getDailymotionId(u);
      return { provider, id, embedUrl: id ? `https://www.dailymotion.com/embed/video/${id}` : null };
    }
    case 'streamable': {
      const id = getStreamableId(u);
      return { provider, id, embedUrl: id ? `https://streamable.com/e/${id}` : null };
    }
    case 'loom': {
      const id = getLoomId(u);
      return { provider, id, embedUrl: id ? `https://www.loom.com/embed/${id}` : null };
    }
    case 'wistia': {
      const id = getWistiaId(u);
      return { provider, id, embedUrl: id ? `https://fast.wistia.net/embed/iframe/${id}` : null };
    }
    case 'screenapp': {
      const id = getScreenappId(u);
      return { provider, id, embedUrl: id ? `https://screenapp.io/app/v/${id}` : null };
    }
    case 'generic':
      return { provider, id: null, embedUrl: u };
    default:
      return { provider, id: null, embedUrl: null };
  }
}

export function isEmbeddableProvider(url: string): boolean {
  const p = detectVideoProvider(url);
  return ['youtube', 'vimeo', 'dailymotion', 'streamable', 'loom', 'wistia', 'screenapp', 'generic'].includes(p);
}

export function isExternalVideoUrl(url: string): boolean {
  return detectVideoProvider(url) !== 'unknown';
}

export function isHtml5VideoUrl(url: string): boolean {
  const p = detectVideoProvider(url);
  return p === 'direct' || p === 'hls';
}

export function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
