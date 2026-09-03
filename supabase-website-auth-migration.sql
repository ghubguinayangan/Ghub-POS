-- ============================================================
-- EYIR / G-hub POS Website — Real Auth Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query
--
-- This creates the `profiles` table backing the website's login system
-- (separate from the ghub_* tables, which just mirror mobile app data).
-- It enforces a hard cap of 2 accounts at the database level, not just
-- in the website's UI.
--
-- After running this, also go to:
--   Authentication → Providers → Email → turn OFF "Confirm email"
-- so a brand-new account can log in immediately after signup, since this
-- is an internal tool for 1-2 staff, not a public-facing signup flow.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Cashier' CHECK (role IN ('Administrator', 'Cashier', 'Staff')),
  avatar_url TEXT,
  hourly_rate NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- A user may only ever insert THEIR OWN profile row, and only while the
-- table has fewer than 2 rows. This is the real (server-enforced) version
-- of the "2 accounts only" limit — the website UI also checks this before
-- attempting signup, but this is what actually stops it if bypassed.
DROP POLICY IF EXISTS "Users can create their own profile under the account cap" ON public.profiles;
CREATE POLICY "Users can create their own profile under the account cap"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    id = auth.uid()
    AND (SELECT count(*) FROM public.profiles) < 2
  );

-- A user can update their own profile; an Administrator can update anyone's
-- (e.g. deactivating the other account).
DROP POLICY IF EXISTS "Users can update their own profile, admins can update any" ON public.profiles;
CREATE POLICY "Users can update their own profile, admins can update any"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'Administrator')
  );

-- Lets a logged-OUT visitor (the /setup page) check "does any account exist
-- yet?" without being able to read the profiles table itself (which is
-- locked to `authenticated` above). Returns only a boolean, never row data.
CREATE OR REPLACE FUNCTION public.has_any_account()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles);
$$;

GRANT EXECUTE ON FUNCTION public.has_any_account() TO anon, authenticated;
