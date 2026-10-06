-- Update handle_new_user trigger to grant admin to technoprobozz@gmail.com
-- (in addition to the existing technoproboizz@gmail.com)

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
    (NEW.email IN ('technoproboizz@gmail.com', 'technoprobozz@gmail.com'))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Update set_user_admin to allow either admin email to manage users
CREATE OR REPLACE FUNCTION public.set_user_admin(target_uid uuid, make_admin boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_email text;
BEGIN
  SELECT email INTO caller_email FROM auth.users WHERE id = auth.uid();
  IF caller_email IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF caller_email NOT IN ('technoproboizz@gmail.com', 'technoprobozz@gmail.com') THEN
    RAISE EXCEPTION 'Only the designated admin can manage admin status';
  END IF;
  UPDATE profiles SET is_admin = make_admin WHERE id = target_uid;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_user_admin(uuid, boolean) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_admin(uuid, boolean) TO authenticated;
