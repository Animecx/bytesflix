import { supabase } from '@/lib/supabase';
import type { Video, VideoWithEpisodes, Series, Episode, EpisodeWithVideo, SeriesWithEpisodes } from '@/types';

export interface VideoQueryOptions {
  genre?: string;
  type?: 'movie' | 'series';
  featured?: boolean;
  trending?: boolean;
  limit?: number;
  orderBy?: 'created_at' | 'views' | 'rating' | 'year';
  ascending?: boolean;
}

export async function fetchVideos(opts: VideoQueryOptions = {}): Promise<Video[]> {
  let query = supabase.from('videos').select('*').eq('status', 'published');

  if (opts.genre) query = query.eq('genre', opts.genre);
  if (opts.type) query = query.eq('type', opts.type);
  if (opts.featured !== undefined) query = query.eq('featured', opts.featured);
  if (opts.trending !== undefined) query = query.eq('trending', opts.trending);

  const order = opts.orderBy ?? 'created_at';
  const ascending = opts.ascending ?? false;
  query = query.order(order, { ascending });

  if (opts.limit) query = query.limit(opts.limit);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Video[];
}

export async function fetchVideoById(id: string): Promise<Video | null> {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as Video | null;
}

export async function fetchFeaturedHero(): Promise<Video | null> {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('status', 'published')
    .eq('featured', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (data) return data as Video;
  // Fallback: latest published video
  const { data: fallback, error: err2 } = await supabase
    .from('videos')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (err2) throw err2;
  return (fallback as Video) ?? null;
}

export async function fetchRelatedVideos(video: Video, limit = 8): Promise<Video[]> {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('status', 'published')
    .neq('id', video.id)
    .or(`genre.eq.${video.genre ?? ''},type.eq.${video.type}`)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Video[];
}

export async function searchVideos(query: string): Promise<Video[]> {
  const term = query.trim();
  if (!term) return [];
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('status', 'published')
    .or(
      `title.ilike.%${term}%,description.ilike.%${term}%,genre.ilike.%${term}%,language.ilike.%${term}%,tags.cs.{${term}}`
    )
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as Video[];
}

// ============================================================
// SERIES
// ============================================================

export async function fetchSeries(): Promise<Series[]> {
  const { data, error } = await supabase
    .from('series')
    .select('*')
    .eq('publish_status', 'published')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Series[];
}

export async function fetchSeriesById(id: string): Promise<Series | null> {
  const { data, error } = await supabase
    .from('series')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as Series | null;
}

export async function fetchSeriesBySlug(slug: string): Promise<Series | null> {
  const { data, error } = await supabase
    .from('series')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data as Series | null;
}

// ============================================================
// EPISODES
// ============================================================

export async function fetchEpisodesBySeries(seriesId: string): Promise<Episode[]> {
  const { data, error } = await supabase
    .from('episodes')
    .select('*')
    .eq('series_id', seriesId)
    .order('season_number', { ascending: true })
    .order('episode_number', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Episode[];
}

export async function fetchEpisodesForVideo(videoId: string): Promise<Episode[]> {
  const { data, error } = await supabase
    .from('episodes')
    .select('*')
    .eq('video_id', videoId);
  if (error) throw error;
  return (data ?? []) as Episode[];
}

/**
 * Fetch all episodes for a series joined with their underlying video rows.
 * Only returns published episodes + published videos (for public watch page).
 */
export async function fetchEpisodesWithVideoBySeries(seriesId: string): Promise<EpisodeWithVideo[]> {
  const { data, error } = await supabase
    .from('episodes')
    .select('*, video:videos(*)')
    .eq('series_id', seriesId)
    .eq('publish_status', 'published')
    .order('season_number', { ascending: true })
    .order('episode_number', { ascending: true });
  if (error) throw error;
  return (data ?? []) as EpisodeWithVideo[];
}

/**
 * Fetch a single episode by its stable slug within a series, joined with video.
 */
export async function fetchEpisodeBySlug(seriesId: string, slug: string): Promise<EpisodeWithVideo | null> {
  const { data, error } = await supabase
    .from('episodes')
    .select('*, video:videos(*)')
    .eq('series_id', seriesId)
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data as EpisodeWithVideo | null;
}

/**
 * Fetch a series by slug together with all its published episodes (with videos).
 */
export async function fetchSeriesWithEpisodesBySlug(slug: string): Promise<SeriesWithEpisodes | null> {
  const series = await fetchSeriesBySlug(slug);
  if (!series) return null;
  const episodes = await fetchEpisodesWithVideoBySeries(series.id);
  return { ...series, episodes };
}

export async function fetchVideoWithEpisodes(id: string): Promise<VideoWithEpisodes | null> {
  const video = await fetchVideoById(id);
  if (!video) return null;
  const episodes = await fetchEpisodesForVideo(id);
  return { ...video, episodes };
}

export async function incrementViews(videoId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_video_views', { video_id: videoId });
  if (error) {
    // Fallback: read-modify-write (best-effort, not atomic)
    const { data } = await supabase.from('videos').select('views').eq('id', videoId).maybeSingle();
    if (data) {
      await supabase.from('videos').update({ views: (data.views ?? 0) + 1 }).eq('id', videoId);
    }
  }
}
