/*
# BytesFlix — Appearance & Custom Popups

Adds a master popups-enabled toggle to settings, creates a popups table for
managing custom announcement popups, and adds a storage bucket for wallpaper
and popup images.
*/

-- ============================================================
-- SETTINGS: add popups_enabled master switch
-- ============================================================
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS popups_enabled boolean NOT NULL DEFAULT false;

-- ============================================================
-- POPUPS table
-- ============================================================
CREATE TABLE IF NOT EXISTS popups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text,
  image_url text,
  button_text text,
  button_url text,
  enabled boolean NOT NULL DEFAULT true,
  display_frequency text NOT NULL DEFAULT 'once'
    CHECK (display_frequency IN ('once', 'session', 'always')),
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE popups ENABLE ROW LEVEL SECURITY;

-- Public read of popups (so anon users see them), admin-only writes
DROP POLICY IF EXISTS "read_popups" ON popups;
CREATE POLICY "read_popups" ON popups FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_popups" ON popups;
CREATE POLICY "admin_insert_popups" ON popups FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_update_popups" ON popups;
CREATE POLICY "admin_update_popups" ON popups FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_delete_popups" ON popups;
CREATE POLICY "admin_delete_popups" ON popups FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- ============================================================
-- STORAGE: wallpapers bucket (for wallpapers + popup images)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('wallpapers', 'wallpapers', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_read_wallpapers" ON storage.objects;
CREATE POLICY "public_read_wallpapers" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'wallpapers');

DROP POLICY IF EXISTS "admin_insert_wallpapers" ON storage.objects;
CREATE POLICY "admin_insert_wallpapers" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'wallpapers'
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_delete_wallpapers" ON storage.objects;
CREATE POLICY "admin_delete_wallpapers" ON storage.objects FOR DELETE
  TO authenticated USING (
    bucket_id = 'wallpapers'
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );
