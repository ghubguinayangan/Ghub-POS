-- ============================================================
-- Admin Email Update Function
-- Run this in: Supabase Dashboard → SQL Editor → New Query
--
-- Allows updating a user's auth email directly via SECURITY DEFINER,
-- bypassing the anon key limitation of supabase.auth.updateUser.
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_admin_email(
  user_id UUID,
  new_email TEXT
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update email in auth.users
  UPDATE auth.users
  SET email = new_email, raw_user_meta_data = raw_user_meta_data || jsonb_build_object('email', new_email)
  WHERE id = user_id;

  -- Update email in profiles
  UPDATE public.profiles
  SET email = new_email
  WHERE id = user_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_admin_email(UUID, TEXT) TO authenticated;
