/*
# BytesFlix — Series & Episode enhancements

Extends the existing series/episodes system to support proper multi-episode
management, stable shareable URLs, and episode-level metadata. Does NOT remove
or rebuild any existing tables — only adds columns and backfills data.

1. Modified Tables
   - `series`
     - ADD `slug text` — URL-safe unique identifier for stable shareable links.
     - ADD `genre text`, `language text`, `year int`, `rating numeric(3,1)`,
       `age_rating text`, `featured boolean`, `trending boolean`,
       `publish_status text` — series-level metadata.
   - `videos`
     - ADD `release_date date` — episode/movie release date.
     - ADD `subtitle_url text` — optional subtitle file URL (VTT/SRT).
   - `episodes`
     - ADD `title text`, `description text`, `thumbnail_url text`,
       `duration_minutes int`, `publish_status text`, `featured boolean`,
       `slug text` — episode-level metadata + stable URL slug.

2. Data Backfill
   - Populate `series.slug` from slugified name for existing rows.
   - Populate `episodes.slug` from series slug + season + episode number.

3. Security
   - No new tables. Existing RLS policies already cover admin-only writes and
     public read of published content. Added columns inherit table RLS.
*/

-- ============================================================
-- SERIES: add metadata + slug
-- ============================================================
ALTER TABLE series
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS genre text,
  ADD COLUMN IF NOT EXISTS language text DEFAULT 'English',
  ADD COLUMN IF NOT EXISTS year int,
  ADD COLUMN IF NOT EXISTS rating numeric(3,1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS age_rating text DEFAULT 'NR',
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trending boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS publish_status text NOT NULL DEFAULT 'published'
    CHECK (publish_status IN ('published','draft','hidden'));

-- Backfill slugs for existing series from their names.
UPDATE series
SET slug = lower(
  regexp_replace(
    trim(regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g')),
    '[\s-]+', '-', 'g'
  )
)
WHERE slug IS NULL;

-- Ensure uniqueness for any collisions by appending the id prefix.
UPDATE series
SET slug = slug || '-' || left(id::text, 6)
WHERE slug IS NOT NULL
  AND id::text <> (
    SELECT min(s2.id::text) FROM series s2 WHERE s2.slug = series.slug
  );

CREATE UNIQUE INDEX IF NOT EXISTS series_slug_unique ON series(slug) WHERE slug IS NOT NULL;

-- ============================================================
-- VIDEOS: add release_date + subtitle_url
-- ============================================================
ALTER TABLE videos
  ADD COLUMN IF NOT EXISTS release_date date,
  ADD COLUMN IF NOT EXISTS subtitle_url text;

-- ============================================================
-- EPISODES: add episode-level metadata + stable slug
-- ============================================================
ALTER TABLE episodes
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS duration_minutes int,
  ADD COLUMN IF NOT EXISTS publish_status text NOT NULL DEFAULT 'published'
    CHECK (publish_status IN ('published','draft','hidden')),
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS slug text;

-- Backfill episode slugs: use series slug + season + episode number.
UPDATE episodes e
SET slug = s.slug || '-s' || e.season_number || '-e' || e.episode_number
FROM series s
WHERE e.series_id = s.id
  AND e.slug IS NULL
  AND s.slug IS NOT NULL;

-- Fallback for any remaining null slugs.
UPDATE episodes
SET slug = 'episode-' || left(id::text, 8)
WHERE slug IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS episodes_slug_unique ON episodes(slug) WHERE slug IS NOT NULL;
