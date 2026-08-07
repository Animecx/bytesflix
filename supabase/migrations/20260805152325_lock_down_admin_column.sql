-- 1. Lock down is_admin: revoke the broad column grant and deny client writes.
--    Only the service role (which bypasses RLS) and SECURITY DEFINER
--    functions can set is_admin.

REVOKE UPDATE (is_admin) ON profiles FROM authenticated, anon;
GRANT UPDATE (display_name, avatar_url) ON profiles TO authenticated;

-- 2. SECURITY DEFINER function: only the designated admin email can
--    promote/demote other users.  All other callers get an exception.

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
  IF caller_email <> 'technoproboizz@gmail.com' THEN
    RAISE EXCEPTION 'Only the designated admin can manage admin status';
  END IF;
  UPDATE profiles SET is_admin = make_admin WHERE id = target_uid;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_user_admin(uuid, boolean) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_admin(uuid, boolean) TO authenticated;
