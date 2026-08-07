-- Only technoproboizz@gmail.com should be admin.
-- The trigger grants is_admin = true exclusively for that email;
-- all other signups get is_admin = false regardless of order.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, is_admin)
  VALUES (
    NEW.id,
    coalesce(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    (NEW.email = 'technoproboizz@gmail.com')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
