-- Fix: handle_new_user fires AFTER INSERT, so the new user is already
-- counted in auth.users. The first-user check must be <= 1 (the just-inserted
-- row), not = 0, otherwise nobody ever becomes admin and all admin-only
-- RLS policies (anime upload, storage, etc.) block every request.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count int;
BEGIN
  SELECT count(*) INTO user_count FROM auth.users;
  INSERT INTO public.profiles (id, display_name, is_admin)
  VALUES (
    NEW.id,
    coalesce(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    (user_count <= 1)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
