/*
# BytesFlix — Anime section

Creates a dedicated set of tables for the Anime section, fully isolated from
the existing movies/series catalog.  All tables follow the same RLS pattern
as the rest of the app: public read of published content, admin-only writes,
owner-scoped CRUD for user-tracking tables.

Tables:
  - anime              — top-level anime title (poster, banner, synopsis, studio, etc.)
  - anime_seasons      — seasons belonging to an anime
  - anime_episodes     — episodes belonging to a season (with video_url)
  - anime_genres       — genres for an anime (many-to-many)
  - anime_reviews      — user reviews + ratings
  - anime_favorites    — user "My Anime List"
  - anime_continue_watching — resume positions
  - anime_watch_history — watch history

Reuses existing storage buckets (videos, posters, banners, trailers).
*/

-- ============================================================
-- ANIME
-- ============================================================
CREATE TABLE IF NOT EXISTS anime (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  original_title text,
  synopsis text,
  poster_url text,
  banner_url text,
  trailer_url text,
  studio text,
  director text,
  release_date date,
  status text NOT NULL DEFAULT 'ongoing' CHECK (status IN ('ongoing','completed')),
  type text NOT NULL DEFAULT 'series' CHECK (type IN ('series','movie','ova','special')),
  episode_count int DEFAULT 0,
  season_count int DEFAULT 1,
  episode_duration_minutes int,
  rating numeric(3,1) DEFAULT 0,
  language text DEFAULT 'Japanese',
  subtitle_languages text DEFAULT 'English',
  dub_available boolean DEFAULT false,
  featured boolean NOT NULL DEFAULT false,
  trending boolean NOT NULL DEFAULT false,
  publish_status text NOT NULL DEFAULT 'published' CHECK (publish_status IN ('published','draft','hidden')),
  views bigint NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE anime ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS anime_publish_status_idx ON anime(publish_status);
CREATE INDEX IF NOT EXISTS anime_trending_idx ON anime(trending) WHERE trending = true;
CREATE INDEX IF NOT EXISTS anime_featured_idx ON anime(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS anime_created_at_idx ON anime(created_at DESC);
CREATE INDEX IF NOT EXISTS anime_rating_idx ON anime(rating DESC);
CREATE INDEX IF NOT EXISTS anime_status_idx ON anime(status);

DROP POLICY IF EXISTS "read_anime" ON anime;
CREATE POLICY "read_anime" ON anime FOR SELECT
  TO anon, authenticated USING (
    publish_status = 'published'
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );
DROP POLICY IF EXISTS "admin_insert_anime" ON anime;
CREATE POLICY "admin_insert_anime" ON anime FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );
DROP POLICY IF EXISTS "admin_update_anime" ON anime;
CREATE POLICY "admin_update_anime" ON anime FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );
DROP POLICY IF EXISTS "admin_delete_anime" ON anime;
CREATE POLICY "admin_delete_anime" ON anime FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- ============================================================
-- ANIME_SEASONS
-- ============================================================
CREATE TABLE IF NOT EXISTS anime_seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anime_id uuid NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
  season_number int NOT NULL DEFAULT 1,
  title text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE anime_seasons ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS anime_seasons_anime_id_idx ON anime_seasons(anime_id);
CREATE UNIQUE INDEX IF NOT EXISTS anime_seasons_anime_season_unique ON anime_seasons(anime_id, season_number);

DROP POLICY IF EXISTS "read_anime_seasons" ON anime_seasons;
CREATE POLICY "read_anime_seasons" ON anime_seasons FOR SELECT
  TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM anime a WHERE a.id = anime_seasons.anime_id AND a.publish_status = 'published')
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );
DROP POLICY IF EXISTS "admin_insert_anime_seasons" ON anime_seasons;
CREATE POLICY "admin_insert_anime_seasons" ON anime_seasons FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );
DROP POLICY IF EXISTS "admin_update_anime_seasons" ON anime_seasons;
CREATE POLICY "admin_update_anime_seasons" ON anime_seasons FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );
DROP POLICY IF EXISTS "admin_delete_anime_seasons" ON anime_seasons;
CREATE POLICY "admin_delete_anime_seasons" ON anime_seasons FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- ============================================================
-- ANIME_EPISODES
-- ============================================================
CREATE TABLE IF NOT EXISTS anime_episodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anime_id uuid NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
  season_id uuid REFERENCES anime_seasons(id) ON DELETE CASCADE,
  season_number int NOT NULL DEFAULT 1,
  episode_number int NOT NULL DEFAULT 1,
  title text,
  description text,
  thumbnail_url text,
  video_url text,
  duration_minutes int,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE anime_episodes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS anime_episodes_anime_id_idx ON anime_episodes(anime_id);
CREATE INDEX IF NOT EXISTS anime_episodes_season_id_idx ON anime_episodes(season_id);
CREATE UNIQUE INDEX IF NOT EXISTS anime_episodes_anime_season_ep_unique ON anime_episodes(anime_id, season_number, episode_number);

DROP POLICY IF EXISTS "read_anime_episodes" ON anime_episodes;
CREATE POLICY "read_anime_episodes" ON anime_episodes FOR SELECT
  TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM anime a WHERE a.id = anime_episodes.anime_id AND a.publish_status = 'published')
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );
DROP POLICY IF EXISTS "admin_insert_anime_episodes" ON anime_episodes;
CREATE POLICY "admin_insert_anime_episodes" ON anime_episodes FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );
DROP POLICY IF EXISTS "admin_update_anime_episodes" ON anime_episodes;
CREATE POLICY "admin_update_anime_episodes" ON anime_episodes FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );
DROP POLICY IF EXISTS "admin_delete_anime_episodes" ON anime_episodes;
CREATE POLICY "admin_delete_anime_episodes" ON anime_episodes FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- ============================================================
-- ANIME_GENRES (many-to-many)
-- ============================================================
CREATE TABLE IF NOT EXISTS anime_genres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anime_id uuid NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
  genre text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE anime_genres ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS anime_genres_anime_id_idx ON anime_genres(anime_id);
CREATE INDEX IF NOT EXISTS anime_genres_genre_idx ON anime_genres(genre);
CREATE UNIQUE INDEX IF NOT EXISTS anime_genres_anime_genre_unique ON anime_genres(anime_id, genre);

DROP POLICY IF EXISTS "read_anime_genres" ON anime_genres;
CREATE POLICY "read_anime_genres" ON anime_genres FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admin_insert_anime_genres" ON anime_genres;
CREATE POLICY "admin_insert_anime_genres" ON anime_genres FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );
DROP POLICY IF EXISTS "admin_delete_anime_genres" ON anime_genres;
CREATE POLICY "admin_delete_anime_genres" ON anime_genres FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- ============================================================
-- ANIME_REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS anime_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anime_id uuid NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  rating int NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 10),
  review text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE anime_reviews ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS anime_reviews_anime_id_idx ON anime_reviews(anime_id);
CREATE UNIQUE INDEX IF NOT EXISTS anime_reviews_user_anime_unique ON anime_reviews(user_id, anime_id);

DROP POLICY IF EXISTS "read_anime_reviews" ON anime_reviews;
CREATE POLICY "read_anime_reviews" ON anime_reviews FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_anime_reviews" ON anime_reviews;
CREATE POLICY "insert_own_anime_reviews" ON anime_reviews FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_anime_reviews" ON anime_reviews;
CREATE POLICY "update_own_anime_reviews" ON anime_reviews FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_anime_reviews" ON anime_reviews;
CREATE POLICY "delete_own_anime_reviews" ON anime_reviews FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- ANIME_FAVORITES (My Anime List)
-- ============================================================
CREATE TABLE IF NOT EXISTS anime_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  anime_id uuid NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE anime_favorites ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS anime_favorites_user_idx ON anime_favorites(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS anime_favorites_user_anime_unique ON anime_favorites(user_id, anime_id);

DROP POLICY IF EXISTS "select_own_anime_favorites" ON anime_favorites;
CREATE POLICY "select_own_anime_favorites" ON anime_favorites FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_anime_favorites" ON anime_favorites;
CREATE POLICY "insert_own_anime_favorites" ON anime_favorites FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_anime_favorites" ON anime_favorites;
CREATE POLICY "delete_own_anime_favorites" ON anime_favorites FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- ANIME_CONTINUE_WATCHING
-- ============================================================
CREATE TABLE IF NOT EXISTS anime_continue_watching (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  anime_id uuid NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
  episode_id uuid REFERENCES anime_episodes(id) ON DELETE SET NULL,
  position_seconds int NOT NULL DEFAULT 0,
  duration_seconds int NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE anime_continue_watching ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS anime_cw_user_idx ON anime_continue_watching(user_id, updated_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS anime_cw_user_anime_unique ON anime_continue_watching(user_id, anime_id);

DROP POLICY IF EXISTS "select_own_anime_cw" ON anime_continue_watching;
CREATE POLICY "select_own_anime_cw" ON anime_continue_watching FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_anime_cw" ON anime_continue_watching;
CREATE POLICY "insert_own_anime_cw" ON anime_continue_watching FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_anime_cw" ON anime_continue_watching;
CREATE POLICY "update_own_anime_cw" ON anime_continue_watching FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_anime_cw" ON anime_continue_watching;
CREATE POLICY "delete_own_anime_cw" ON anime_continue_watching FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- ANIME_WATCH_HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS anime_watch_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  anime_id uuid NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
  episode_id uuid REFERENCES anime_episodes(id) ON DELETE SET NULL,
  watched_at timestamptz DEFAULT now()
);
ALTER TABLE anime_watch_history ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS anime_wh_user_idx ON anime_watch_history(user_id, watched_at DESC);

DROP POLICY IF EXISTS "select_own_anime_wh" ON anime_watch_history;
CREATE POLICY "select_own_anime_wh" ON anime_watch_history FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_anime_wh" ON anime_watch_history;
CREATE POLICY "insert_own_anime_wh" ON anime_watch_history FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_anime_wh" ON anime_watch_history;
CREATE POLICY "update_own_anime_wh" ON anime_watch_history FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_anime_wh" ON anime_watch_history;
CREATE POLICY "delete_own_anime_wh" ON anime_watch_history FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- Increment helper for anime views
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_anime_views(a_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE anime SET views = views + 1 WHERE id = a_id;
$$;