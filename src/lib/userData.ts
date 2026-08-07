import { supabase } from '@/lib/supabase';
import type { Video, ContinueWatchingItem, FavoriteItem, WatchHistoryItem } from '@/types';

export async function fetchFavorites(userId: string): Promise<Video[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select('video:videos(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as unknown as { video: Video | null }[];
  return rows.map((row) => row.video).filter((v): v is Video => v !== null && v !== undefined);
}

export async function isFavorite(userId: string, videoId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('video_id', videoId)
    .maybeSingle();
  if (error) return false;
  return !!data;
}

export async function toggleFavorite(userId: string, videoId: string): Promise<boolean> {
  // Returns true if now favorite, false if removed.
  const existing = await isFavorite(userId, videoId);
  if (existing) {
    await supabase.from('favorites').delete().eq('user_id', userId).eq('video_id', videoId);
    return false;
  } else {
    const { error } = await supabase
      .from('favorites')
      .insert({ user_id: userId, video_id: videoId });
    if (error) throw error;
    return true;
  }
}

export async function fetchContinueWatching(userId: string): Promise<ContinueWatchingItem[]> {
  const { data, error } = await supabase
    .from('continue_watching')
    .select('*, video:videos(*)')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as ContinueWatchingItem[];
}

export async function fetchContinueWatchingWithVideos(userId: string): Promise<Video[]> {
  const items = await fetchContinueWatching(userId);
  return items
    .map((item) => item.video)
    .filter((v): v is Video => v !== null && v !== undefined);
}

export async function saveContinueWatching(
  userId: string,
  videoId: string,
  positionSeconds: number,
  durationSeconds: number
): Promise<void> {
  const { error } = await supabase
    .from('continue_watching')
    .upsert(
      {
        user_id: userId,
        video_id: videoId,
        position_seconds: Math.floor(positionSeconds),
        duration_seconds: Math.floor(durationSeconds),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,video_id' }
    );
  if (error) throw error;
}

export async function removeContinueWatching(userId: string, videoId: string): Promise<void> {
  await supabase
    .from('continue_watching')
    .delete()
    .eq('user_id', userId)
    .eq('video_id', videoId);
}

export async function getResumePosition(userId: string, videoId: string): Promise<number> {
  const { data, error } = await supabase
    .from('continue_watching')
    .select('position_seconds')
    .eq('user_id', userId)
    .eq('video_id', videoId)
    .maybeSingle();
  if (error || !data) return 0;
  return (data as { position_seconds: number }).position_seconds;
}

export async function fetchWatchHistory(userId: string): Promise<WatchHistoryItem[]> {
  const { data, error } = await supabase
    .from('watch_history')
    .select('*, video:videos(*)')
    .eq('user_id', userId)
    .order('watched_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as WatchHistoryItem[];
}

export async function addToWatchHistory(userId: string, videoId: string): Promise<void> {
  const { error } = await supabase
    .from('watch_history')
    .upsert(
      { user_id: userId, video_id: videoId, watched_at: new Date().toISOString() },
      { onConflict: 'user_id,video_id' }
    );
  if (error) throw error;
}

export async function fetchFavoriteItems(userId: string): Promise<FavoriteItem[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select('*, video:videos(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as FavoriteItem[];
}
