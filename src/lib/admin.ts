import { supabase, STORAGE_BUCKETS } from '@/lib/supabase';
import type { Video, Series, Episode, EpisodeWithVideo, Profile, SiteSettings } from '@/types';
import { slugify } from '@/lib/utils';

export interface AdminStats {
  totalVideos: number;
  totalUsers: number;
  totalViews: number;
  totalSeries: number;
  publishedCount: number;
  draftCount: number;
  hiddenCount: number;
  recentUploads: Video[];
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const [videosRes, usersRes, seriesRes] = await Promise.all([
    supabase.from('videos').select('id, views, status, created_at, title, poster_url, type').order('created_at', { ascending: false }),
    supabase.from('profiles').select('id', { count: 'exact', head: false }),
    supabase.from('series').select('id', { count: 'exact', head: true }),
  ]);

  if (videosRes.error) throw videosRes.error;
  if (usersRes.error) throw usersRes.error;

  const videos = (videosRes.data ?? []) as Array<
    Pick<Video, 'id' | 'views' | 'status' | 'created_at' | 'title' | 'poster_url' | 'type'>
  >;

  const totalViews = videos.reduce((sum, v) => sum + (v.views ?? 0), 0);
  const publishedCount = videos.filter((v) => v.status === 'published').length;
  const draftCount = videos.filter((v) => v.status === 'draft').length;
  const hiddenCount = videos.filter((v) => v.status === 'hidden').length;

  return {
    totalVideos: videos.length,
    totalUsers: usersRes.count ?? 0,
    totalViews,
    totalSeries: seriesRes.count ?? 0,
    publishedCount,
    draftCount,
    hiddenCount,
    recentUploads: videos.slice(0, 6) as Video[],
  };
}

export async function fetchAllVideosAdmin(): Promise<Video[]> {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Video[];
}

export async function fetchAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function createVideo(input: Omit<Video, 'id' | 'created_at' | 'updated_at' | 'views'> & Partial<Pick<Video, 'subtitle_url' | 'release_date'>>): Promise<Video> {
  const { data, error } = await supabase
    .from('videos')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Video;
}

export async function updateVideo(id: string, patch: Partial<Video>): Promise<Video> {
  const { data, error } = await supabase
    .from('videos')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Video;
}

export async function deleteVideo(id: string): Promise<void> {
  // Fetch the video to get storage URLs before deleting the row
  const { data: video } = await supabase
    .from('videos')
    .select('video_url, poster_url, banner_url, trailer_url')
    .eq('id', id)
    .maybeSingle();

  // Delete associated storage files (best-effort, don't block on errors)
  if (video) {
    const filesToDelete: Array<{ bucket: keyof typeof STORAGE_BUCKETS; url: string }> = [];
    if (video.video_url) filesToDelete.push({ bucket: 'videos', url: video.video_url });
    if (video.poster_url) filesToDelete.push({ bucket: 'posters', url: video.poster_url });
    if (video.banner_url) filesToDelete.push({ bucket: 'banners', url: video.banner_url });
    if (video.trailer_url) filesToDelete.push({ bucket: 'trailers', url: video.trailer_url });

    for (const { bucket, url } of filesToDelete) {
      const path = extractStoragePath(url);
      if (path) {
        try {
          await deleteFile(bucket, path);
        } catch {
          // Storage file may already be gone or path may be external — ignore
        }
      }
    }
  }

  const { error } = await supabase.from('videos').delete().eq('id', id);
  if (error) throw error;
}

export async function createSeries(input: Omit<Series, 'id' | 'created_at' | 'updated_at' | 'slug' | 'genre' | 'language' | 'year' | 'rating' | 'age_rating' | 'featured' | 'trending' | 'publish_status'> & Partial<Pick<Series, 'slug' | 'genre' | 'language' | 'year' | 'rating' | 'age_rating' | 'featured' | 'trending' | 'publish_status'>>): Promise<Series> {
  const slug = await ensureUniqueSeriesSlug(input.name);
  const { data, error } = await supabase
    .from('series')
    .insert({ ...input, slug })
    .select()
    .single();
  if (error) throw error;
  return data as Series;
}

export async function updateSeries(id: string, patch: Partial<Series>): Promise<Series> {
  const { data, error } = await supabase
    .from('series')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Series;
}

export async function fetchAllSeriesAdmin(): Promise<Series[]> {
  const { data, error } = await supabase
    .from('series')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Series[];
}

export async function fetchEpisodesWithVideoAdmin(seriesId: string): Promise<EpisodeWithVideo[]> {
  const { data, error } = await supabase
    .from('episodes')
    .select('*, video:videos(*)')
    .eq('series_id', seriesId)
    .order('season_number', { ascending: true })
    .order('episode_number', { ascending: true });
  if (error) throw error;
  return (data ?? []) as EpisodeWithVideo[];
}

async function ensureUniqueSeriesSlug(name: string): Promise<string> {
  const base = slugify(name) || 'series';
  let candidate = base;
  for (let i = 0; i < 50; i++) {
    const { data } = await supabase
      .from('series')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${i + 2}`;
  }
  return `${base}-${Date.now().toString(36).slice(-4)}`;
}

export async function createEpisode(input: Omit<Episode, 'id' | 'created_at' | 'slug'> & Partial<Pick<Episode, 'slug'>>): Promise<Episode> {
  const slug = await ensureUniqueEpisodeSlug(input.series_id, input.season_number, input.episode_number);
  const { data, error } = await supabase
    .from('episodes')
    .insert({ ...input, slug })
    .select()
    .single();
  if (error) throw error;
  return data as Episode;
}

export async function updateEpisode(id: string, patch: Partial<Episode>): Promise<Episode> {
  const { data, error } = await supabase
    .from('episodes')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Episode;
}

export async function deleteEpisode(id: string): Promise<void> {
  const { data: episode } = await supabase
    .from('episodes')
    .select('video_id, thumbnail_url')
    .eq('id', id)
    .maybeSingle();

  if (episode?.thumbnail_url) {
    const path = extractStoragePath(episode.thumbnail_url);
    if (path) {
      try { await deleteFile('posters', path); } catch { /* best-effort */ }
    }
  }

  if (episode?.video_id) {
    try { await deleteVideo(episode.video_id); } catch { /* best-effort */ }
  }

  const { error } = await supabase.from('episodes').delete().eq('id', id);
  if (error) throw error;
}

async function ensureUniqueEpisodeSlug(seriesId: string, season: number, episode: number): Promise<string> {
  const { data: series } = await supabase
    .from('series')
    .select('slug')
    .eq('id', seriesId)
    .maybeSingle();
  const seriesSlug = (series as { slug: string | null } | null)?.slug;
  const base = seriesSlug
    ? `${seriesSlug}-s${season}-e${episode}`
    : `s${season}-e${episode}`;
  let candidate = base;
  for (let i = 0; i < 50; i++) {
    const { data } = await supabase
      .from('episodes')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${i + 2}`;
  }
  return `${base}-${Date.now().toString(36).slice(-4)}`;
}

export async function updateSettings(patch: Partial<SiteSettings>): Promise<SiteSettings> {
  const { data, error } = await supabase
    .from('settings')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', 1)
    .select()
    .single();
  if (error) throw error;
  return data as SiteSettings;
}

export async function setUserAdmin(userId: string, isAdmin: boolean): Promise<void> {
  const { error } = await supabase.rpc('set_user_admin', { target_uid: userId, make_admin: isAdmin });
  if (error) throw error;
}

export interface UploadResult {
  path: string;
  publicUrl: string;
}

export async function uploadFile(
  bucket: keyof typeof STORAGE_BUCKETS,
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  const bucketName = STORAGE_BUCKETS[bucket];
  const ext = file.name.split('.').pop() ?? 'bin';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
  const path = fileName;

  const { error } = await supabase.storage.from(bucketName).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
  onProgress?.(100);
  return { path, publicUrl: data.publicUrl };
}

export async function deleteFile(bucket: keyof typeof STORAGE_BUCKETS, path: string): Promise<void> {
  const { error } = await supabase.storage.from(STORAGE_BUCKETS[bucket]).remove([path]);
  if (error) throw error;
}

export function extractStoragePath(url: string): string | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/');
    // .../storage/v1/object/public/<bucket>/<path>
    const bucketIdx = parts.findIndex((p) => p === 'public');
    if (bucketIdx === -1) return null;
    return parts.slice(bucketIdx + 2).join('/');
  } catch {
    return null;
  }
}
