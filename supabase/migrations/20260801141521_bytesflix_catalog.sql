/*
# BytesFlix — Catalog + user tables (part 2)

Creates all content and user-tracking tables. Depends on `profiles` (part 1).

1. New Tables
   - categories, series, videos, episodes
   - watch_history, continue_watching, favorites
   - settings (singleton site config)
2. Security
   - Public (anon+authenticated) read of published content; admin-only writes.
   - Owner-scoped CRUD for watch_history / continue_watching / favorites.
   - settings: public read, admin update.
3. Seeds default settings row + base categories.
*/

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_categories" ON categories;
CREATE POLICY "public_read_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_categories" ON categories;
CREATE POLICY "admin_insert_categories" ON categories FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_update_categories" ON categories;
CREATE POLICY "admin_update_categories" ON categories FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_delete_categories" ON categories;
CREATE POLICY "admin_delete_categories" ON categories FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- ============================================================
-- SERIES
-- ============================================================
CREATE TABLE IF NOT EXISTS series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  poster_url text,
  banner_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE series ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_series" ON series;
CREATE POLICY "public_read_series" ON series FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_series" ON series;
CREATE POLICY "admin_insert_series" ON series FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_update_series" ON series;
CREATE POLICY "admin_update_series" ON series FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_delete_series" ON series;
CREATE POLICY "admin_delete_series" ON series FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- ============================================================
-- VIDEOS
-- ============================================================
CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'movie' CHECK (type IN ('movie','series')),
  series_id uuid REFERENCES series(id) ON DELETE SET NULL,
  poster_url text,
  banner_url text,
  video_url text,
  trailer_url text,
  genre text,
  language text DEFAULT 'English',
  year int,
  duration_minutes int,
  rating numeric(3,1) DEFAULT 0,
  age_rating text DEFAULT 'NR',
  featured boolean NOT NULL DEFAULT false,
  trending boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published','draft','hidden')),
  tags text[] DEFAULT '{}',
  views bigint NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS videos_status_idx ON videos(status);
CREATE INDEX IF NOT EXISTS videos_type_idx ON videos(type);
CREATE INDEX IF NOT EXISTS videos_featured_idx ON videos(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS videos_trending_idx ON videos(trending) WHERE trending = true;
CREATE INDEX IF NOT EXISTS videos_created_at_idx ON videos(created_at DESC);
CREATE INDEX IF NOT EXISTS videos_genre_idx ON videos(genre);
CREATE INDEX IF NOT EXISTS videos_series_id_idx ON videos(series_id);

DROP POLICY IF EXISTS "read_videos" ON videos;
CREATE POLICY "read_videos" ON videos FOR SELECT
  TO anon, authenticated USING (
    status = 'published'
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_insert_videos" ON videos;
CREATE POLICY "admin_insert_videos" ON videos FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_update_videos" ON videos;
CREATE POLICY "admin_update_videos" ON videos FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_delete_videos" ON videos;
CREATE POLICY "admin_delete_videos" ON videos FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- ============================================================
-- EPISODES
-- ============================================================
CREATE TABLE IF NOT EXISTS episodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  series_id uuid NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  season_number int NOT NULL DEFAULT 1,
  episode_number int NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS episodes_series_id_idx ON episodes(series_id);
CREATE INDEX IF NOT EXISTS episodes_video_id_idx ON episodes(video_id);
CREATE UNIQUE INDEX IF NOT EXISTS episodes_series_season_ep_unique ON episodes(series_id, season_number, episode_number);

DROP POLICY IF EXISTS "read_episodes" ON episodes;
CREATE POLICY "read_episodes" ON episodes FOR SELECT
  TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM videos v WHERE v.id = episodes.video_id AND v.status = 'published')
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_insert_episodes" ON episodes;
CREATE POLICY "admin_insert_episodes" ON episodes FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_update_episodes" ON episodes;
CREATE POLICY "admin_update_episodes" ON episodes FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_delete_episodes" ON episodes;
CREATE POLICY "admin_delete_episodes" ON episodes FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- ============================================================
-- WATCH HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS watch_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  watched_at timestamptz DEFAULT now()
);
ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS watch_history_user_idx ON watch_history(user_id, watched_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS watch_history_user_video_unique ON watch_history(user_id, video_id);

DROP POLICY IF EXISTS "select_own_watch_history" ON watch_history;
CREATE POLICY "select_own_watch_history" ON watch_history FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_watch_history" ON watch_history;
CREATE POLICY "insert_own_watch_history" ON watch_history FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_watch_history" ON watch_history;
CREATE POLICY "update_own_watch_history" ON watch_history FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_watch_history" ON watch_history;
CREATE POLICY "delete_own_watch_history" ON watch_history FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- CONTINUE WATCHING
-- ============================================================
CREATE TABLE IF NOT EXISTS continue_watching (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  position_seconds int NOT NULL DEFAULT 0,
  duration_seconds int NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE continue_watching ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS continue_watching_user_idx ON continue_watching(user_id, updated_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS continue_watching_user_video_unique ON continue_watching(user_id, video_id);

DROP POLICY IF EXISTS "select_own_continue" ON continue_watching;
CREATE POLICY "select_own_continue" ON continue_watching FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_continue" ON continue_watching;
CREATE POLICY "insert_own_continue" ON continue_watching FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_continue" ON continue_watching;
CREATE POLICY "update_own_continue" ON continue_watching FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_continue" ON continue_watching;
CREATE POLICY "delete_own_continue" ON continue_watching FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- FAVORITES (My List)
-- ============================================================
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS favorites_user_idx ON favorites(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS favorites_user_video_unique ON favorites(user_id, video_id);

DROP POLICY IF EXISTS "select_own_favorites" ON favorites;
CREATE POLICY "select_own_favorites" ON favorites FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_favorites" ON favorites;
CREATE POLICY "insert_own_favorites" ON favorites FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_favorites" ON favorites;
CREATE POLICY "delete_own_favorites" ON favorites FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- SETTINGS (singleton)
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  site_name text NOT NULL DEFAULT 'BytesFlix',
  logo_url text,
  hero_banner_url text,
  accent_color text NOT NULL DEFAULT '#E50914',
  maintenance_mode boolean NOT NULL DEFAULT false,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_settings" ON settings;
CREATE POLICY "public_read_settings" ON settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_update_settings" ON settings;
CREATE POLICY "admin_update_settings" ON settings FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (name, slug) VALUES
  ('Action', 'action'),
  ('Comedy', 'comedy'),
  ('Drama', 'drama'),
  ('Anime', 'anime'),
  ('Documentary', 'documentary'),
  ('Thriller', 'thriller'),
  ('Sci-Fi', 'sci-fi'),
  ('Romance', 'romance'),
  ('Horror', 'horror'),
  ('Animation', 'animation')
ON CONFLICT (slug) DO NOTHING;
