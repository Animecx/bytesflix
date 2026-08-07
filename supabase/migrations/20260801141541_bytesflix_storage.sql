/*
# BytesFlix — Storage buckets + policies

Creates the six storage buckets used by the upload system and Admin Dashboard,
with public read + authenticated-admin write policies.

Buckets:
  - videos      — main streamable video files (MP4)
  - posters     — vertical poster artwork
  - banners     — wide hero/banner artwork
  - trailers    — trailer video files
  - avatars     — user profile avatars
  - subtitles   — subtitle files (VTT/SRT)
*/

INSERT INTO storage.buckets (id, name, public) VALUES
  ('videos', 'videos', true),
  ('posters', 'posters', true),
  ('banners', 'banners', true),
  ('trailers', 'trailers', true),
  ('avatars', 'avatars', true),
  ('subtitles', 'subtitles', true)
ON CONFLICT (id) DO NOTHING;

-- Helper: admin check via profiles table.
-- Storage policies run as the requesting user, so auth.uid() is available.

-- VIDEOS bucket
DROP POLICY IF EXISTS "public_read_videos" ON storage.objects;
CREATE POLICY "public_read_videos" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'videos');

DROP POLICY IF EXISTS "admin_insert_videos" ON storage.objects;
CREATE POLICY "admin_insert_videos" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'videos'
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_update_videos" ON storage.objects;
CREATE POLICY "admin_update_videos" ON storage.objects FOR UPDATE
  TO authenticated USING (
    bucket_id = 'videos'
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  ) WITH CHECK (
    bucket_id = 'videos'
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_delete_videos" ON storage.objects;
CREATE POLICY "admin_delete_videos" ON storage.objects FOR DELETE
  TO authenticated USING (
    bucket_id = 'videos'
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- POSTERS bucket
DROP POLICY IF EXISTS "public_read_posters" ON storage.objects;
CREATE POLICY "public_read_posters" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'posters');

DROP POLICY IF EXISTS "admin_insert_posters" ON storage.objects;
CREATE POLICY "admin_insert_posters" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'posters'
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_delete_posters" ON storage.objects;
CREATE POLICY "admin_delete_posters" ON storage.objects FOR DELETE
  TO authenticated USING (
    bucket_id = 'posters'
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- BANNERS bucket
DROP POLICY IF EXISTS "public_read_banners" ON storage.objects;
CREATE POLICY "public_read_banners" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'banners');

DROP POLICY IF EXISTS "admin_insert_banners" ON storage.objects;
CREATE POLICY "admin_insert_banners" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'banners'
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_delete_banners" ON storage.objects;
CREATE POLICY "admin_delete_banners" ON storage.objects FOR DELETE
  TO authenticated USING (
    bucket_id = 'banners'
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- TRAILERS bucket
DROP POLICY IF EXISTS "public_read_trailers" ON storage.objects;
CREATE POLICY "public_read_trailers" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'trailers');

DROP POLICY IF EXISTS "admin_insert_trailers" ON storage.objects;
CREATE POLICY "admin_insert_trailers" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'trailers'
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_delete_trailers" ON storage.objects;
CREATE POLICY "admin_delete_trailers" ON storage.objects FOR DELETE
  TO authenticated USING (
    bucket_id = 'trailers'
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- AVATARS bucket (users manage their own)
DROP POLICY IF EXISTS "public_read_avatars" ON storage.objects;
CREATE POLICY "public_read_avatars" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "auth_insert_avatars" ON storage.objects;
CREATE POLICY "auth_insert_avatars" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "owner_update_avatars" ON storage.objects;
CREATE POLICY "owner_update_avatars" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'avatars') WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "owner_delete_avatars" ON storage.objects;
CREATE POLICY "owner_delete_avatars" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'avatars');

-- SUBTITLES bucket
DROP POLICY IF EXISTS "public_read_subtitles" ON storage.objects;
CREATE POLICY "public_read_subtitles" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'subtitles');

DROP POLICY IF EXISTS "admin_insert_subtitles" ON storage.objects;
CREATE POLICY "admin_insert_subtitles" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'subtitles'
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_delete_subtitles" ON storage.objects;
CREATE POLICY "admin_delete_subtitles" ON storage.objects FOR DELETE
  TO authenticated USING (
    bucket_id = 'subtitles'
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );
