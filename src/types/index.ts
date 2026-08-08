export type VideoType = 'movie' | 'series';
export type VideoStatus = 'published' | 'draft' | 'hidden';

export interface Category {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Series {
  id: string;
  name: string;
  description: string | null;
  poster_url: string | null;
  banner_url: string | null;
  genre: string | null;
  language: string | null;
  year: number | null;
  rating: number | null;
  age_rating: string | null;
  featured: boolean;
  trending: boolean;
  publish_status: VideoStatus;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: string;
  title: string;
  description: string | null;
  type: VideoType;
  series_id: string | null;
  poster_url: string | null;
  banner_url: string | null;
  video_url: string | null;
  trailer_url: string | null;
  subtitle_url: string | null;
  release_date: string | null;
  genre: string | null;
  language: string | null;
  year: number | null;
  duration_minutes: number | null;
  rating: number | null;
  age_rating: string | null;
  featured: boolean;
  trending: boolean;
  status: VideoStatus;
  tags: string[] | null;
  views: number;
  created_at: string;
  updated_at: string;
}

export interface Episode {
  id: string;
  video_id: string;
  series_id: string;
  season_number: number;
  episode_number: number;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  duration_minutes: number | null;
  publish_status: VideoStatus;
  featured: boolean;
  slug: string | null;
  created_at: string;
}

export interface EpisodeWithVideo extends Episode {
  video?: Video | null;
}

export interface VideoWithEpisodes extends Video {
  episodes?: Episode[];
}

export interface SeriesWithEpisodes extends Series {
  episodes?: EpisodeWithVideo[];
}

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface WatchHistoryItem {
  id: string;
  user_id: string;
  video_id: string;
  watched_at: string;
  video?: Video;
}

export interface ContinueWatchingItem {
  id: string;
  user_id: string;
  video_id: string;
  position_seconds: number;
  duration_seconds: number;
  updated_at: string;
  video?: Video;
}

export interface FavoriteItem {
  id: string;
  user_id: string;
  video_id: string;
  created_at: string;
  video?: Video;
}

export interface SiteSettings {
  id: number;
  site_name: string;
  logo_url: string | null;
  hero_banner_url: string | null;
  accent_color: string;
  maintenance_mode: boolean;
  updated_at: string;
}
