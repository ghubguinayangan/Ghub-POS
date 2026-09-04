-- ============================================================
-- Security Question Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query
--
-- Adds security question support for password recovery.
-- ============================================================

-- 1. Add security question columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS security_question TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS security_answer TEXT NOT NULL DEFAULT '';

-- 2. RPC: Get security question for a given email (public, no auth needed)
-- SECURITY DEFINER so logged-out users can call it to see the question.
CREATE OR REPLACE FUNCTION public.get_security_question(email_text TEXT)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(security_question, '')
  FROM public.profiles
  WHERE email = email_text
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_security_question(TEXT) TO anon, authenticated;

-- 3. RPC: Verify security answer and reset password (public, no auth needed)
-- SECURITY DEFINER so it can update auth.users directly.
-- Returns true if the answer was correct and password was reset, false otherwise.
CREATE OR REPLACE FUNCTION public.reset_password_with_security(
  email_text TEXT,
  answer_text TEXT,
  new_password TEXT
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  found_id UUID;
  stored_answer TEXT;
BEGIN
  -- Find the profile
  SELECT id, security_answer INTO found_id, stored_answer
  FROM public.profiles
  WHERE email = email_text
  LIMIT 1;

  -- No profile found
  IF found_id IS NULL THEN
    RETURN false;
  END IF;

  -- No security question set
  IF stored_answer = '' OR stored_answer IS NULL THEN
    RETURN false;
  END IF;

  -- Verify answer (case-insensitive)
  IF LOWER(TRIM(answer_text)) != LOWER(TRIM(stored_answer)) THEN
    RETURN false;
  END IF;

  -- Update the password in auth.users
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf'))
  WHERE id = found_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reset_password_with_security(TEXT, TEXT, TEXT) TO anon, authenticated;
