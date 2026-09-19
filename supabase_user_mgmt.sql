-- =============================================================================
--  Bedo Courses Dashboard — User Management & Auto-Confirm Migration
--  Run in: Supabase Dashboard → SQL Editor
--  https://supabase.com/dashboard/project/wfnbaibpegcqqlonphmy/sql/new
-- =============================================================================
--
--  This script solves:
--    1. Immediate Fix: Confirms all existing unconfirmed accounts so you can log in right now.
--    2. Permanent Fix: Adds an auto-confirm trigger on auth.users so new signups are
--       instantly confirmed without waiting for confirmation emails (bypasses rate limits).
--    3. list_all_users() RPC: Returns all accounts, their profile names, created_at,
--       and is_confirmed status for the Dashboard Settings -> Users tab.
--    4. confirm_user(UUID) RPC: Allows confirming any unconfirmed user from the dashboard.
--    5. delete_user_complete(UUID) RPC: Completely purges a user, their auth credentials,
--       and all associated data (notes, projects, courses, sessions, roadmaps).
--    6. Foreign Key Cascades: ON DELETE CASCADE on user_id across all tables.
-- =============================================================================

-- ── 1. Auto-Confirm Trigger for all future signups ───────────────────────────
-- This ensures any account created never gets stuck waiting for confirmation emails
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS trigger AS $$
BEGIN
  NEW.email_confirmed_at := COALESCE(NEW.email_confirmed_at, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_auto_confirm_user ON auth.users;
CREATE TRIGGER tr_auto_confirm_user
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_user();


-- ── 2. Immediately Confirm Existing Unconfirmed Users ────────────────────────
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;


-- ── 3. RPC: Confirm specific user by ID ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.confirm_user(target_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
  WHERE id = target_user_id;

  RETURN jsonb_build_object('success', true, 'user_id', target_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_user(UUID) TO authenticated, service_role, anon;


-- ── 4. RPC: delete_user_complete ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.delete_user_complete(target_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_name  TEXT;
BEGIN
  SELECT email, name
    INTO v_email, v_name
    FROM public.profiles
   WHERE id = target_user_id;

  DELETE FROM public.daily_activity WHERE user_id::text = target_user_id::text;
  DELETE FROM public.sessions       WHERE user_id::text = target_user_id::text;
  DELETE FROM public.notes          WHERE user_id::text = target_user_id::text;
  DELETE FROM public.projects       WHERE user_id::text = target_user_id::text;
  DELETE FROM public.courses        WHERE user_id::text = target_user_id::text;
  DELETE FROM public.roadmaps       WHERE user_id::text = target_user_id::text;
  DELETE FROM public.profiles       WHERE id = target_user_id;

  DELETE FROM auth.users WHERE id = target_user_id;

  RETURN jsonb_build_object(
    'deleted',  true,
    'user_id',  target_user_id,
    'email',    v_email,
    'name',     v_name
  );
EXCEPTION
  WHEN others THEN
    RETURN jsonb_build_object(
      'deleted', false,
      'error',   SQLERRM
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_complete(UUID) TO authenticated, service_role, anon;


-- ── 5. RPC: list_all_users (with is_confirmed flag) ───────────────────────────
-- Note: DROP first because return type changed to include is_confirmed
DROP FUNCTION IF EXISTS public.list_all_users();

CREATE OR REPLACE FUNCTION public.list_all_users()
RETURNS TABLE(
  user_id        UUID,
  email          TEXT,
  name           TEXT,
  username       TEXT,
  created_at     TIMESTAMPTZ,
  is_confirmed   BOOLEAN,
  notes_count    BIGINT,
  sessions_count BIGINT,
  projects_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.id                                                          AS user_id,
    u.email,
    COALESCE(p.name, split_part(u.email, '@', 1))               AS name,
    p.username,
    u.created_at,
    (u.email_confirmed_at IS NOT NULL)                           AS is_confirmed,
    (SELECT COUNT(*) FROM public.notes    n  WHERE n.user_id::text  = u.id::text) AS notes_count,
    (SELECT COUNT(*) FROM public.sessions s  WHERE s.user_id::text  = u.id::text) AS sessions_count,
    (SELECT COUNT(*) FROM public.projects pr WHERE pr.user_id::text = u.id::text) AS projects_count
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  ORDER BY u.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.list_all_users() TO authenticated, service_role, anon;


-- ── 6. Migrate user_id columns & cascade constraints ─────────────────────────
DO $$
BEGIN
  ALTER TABLE public.roadmaps ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
EXCEPTION WHEN others THEN NULL;
END$$;

DO $$
BEGIN
  ALTER TABLE public.roadmaps ADD CONSTRAINT roadmaps_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN others THEN NULL;
END$$;

DO $$
BEGIN
  ALTER TABLE public.courses ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
EXCEPTION WHEN others THEN NULL;
END$$;

DO $$
BEGIN
  ALTER TABLE public.courses ADD CONSTRAINT courses_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN others THEN NULL;
END$$;

DO $$
BEGIN
  ALTER TABLE public.notes ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
EXCEPTION WHEN others THEN NULL;
END$$;

DO $$
BEGIN
  ALTER TABLE public.notes ADD CONSTRAINT notes_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN others THEN NULL;
END$$;

DO $$
BEGIN
  ALTER TABLE public.projects ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
EXCEPTION WHEN others THEN NULL;
END$$;

DO $$
BEGIN
  ALTER TABLE public.projects ADD CONSTRAINT projects_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN others THEN NULL;
END$$;

DO $$
BEGIN
  ALTER TABLE public.sessions ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
EXCEPTION WHEN others THEN NULL;
END$$;

DO $$
BEGIN
  ALTER TABLE public.sessions ADD CONSTRAINT sessions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN others THEN NULL;
END$$;

DO $$
BEGIN
  ALTER TABLE public.daily_activity ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
EXCEPTION WHEN others THEN NULL;
END$$;

DO $$
BEGIN
  ALTER TABLE public.daily_activity ADD CONSTRAINT daily_activity_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN others THEN NULL;
END$$;


-- ── 7. Smoke-test: View all users and their confirmation status ──────────────
SELECT * FROM public.list_all_users();