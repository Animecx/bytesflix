/*
# BytesFlix — First user becomes admin

Updates the handle_new_user trigger so that the very first user to register
is automatically granted is_admin = true.  Subsequent users get is_admin = false.
This ensures there's always at least one admin to manage content.
*/

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
    (user_count = 0)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;