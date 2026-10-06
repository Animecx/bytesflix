-- Add download_enabled column to videos table (for movies and series episode videos)
ALTER TABLE videos
  ADD COLUMN IF NOT EXISTS download_enabled boolean NOT NULL DEFAULT false;

-- Add download_enabled column to episodes table (for per-episode control)
ALTER TABLE episodes
  ADD COLUMN IF NOT EXISTS download_enabled boolean NOT NULL DEFAULT false;
