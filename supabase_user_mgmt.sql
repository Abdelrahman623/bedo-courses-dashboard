-- =============================================================================
--  Bedo Courses Dashboard — User Management & Auto-Confirm Migration
--  Run in: Supabase Dashboard → SQL Editor
--  https://supabase.com/dashboard/project/wfnbaibpegcqqlonphmy/sql/new
--  NOTE: This script is idempotent — safe to re-run.
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
--       and ALL associated data — notes, projects, courses, TOPICS, sessions, roadmaps,
--       daily_activity. (Earlier version of this script missed topics.)
--    6. on_auth_user_deleted TRIGGER: guarantees the same full cleanup happens no matter
--       HOW a user is deleted — via this app's Settings button, the Supabase Dashboard's
--       Authentication tab, or the Admin API — instead of only when delete_user_complete()
--       is called directly. This replaces the old "ALTER COLUMN user_id TYPE UUID" cascade
--       attempt (section 6 in the previous version), which silently failed on every table:
--       it was wrapped in "EXCEPTION WHEN others THEN NULL", which swallows any error —
--       including the near-guaranteed failure of casting the literal default value 'local'
--       to UUID — so no cascade constraint was ever actually created, with nothing telling
--       you it had failed. The trigger below works regardless of user_id's column type.
--    7. One-time sweep of any orphaned rows already left behind by past deletions, plus a
--       verification query at the end that should show 0 orphans per table.
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


-- ── 4. RPC: delete_user_complete (now also purges topics) ────────────────────
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

  -- Topics have no direct user_id column — resolve via the user's courses first.
  DELETE FROM public.topics WHERE course_id IN (
    SELECT id FROM public.courses WHERE user_id::text = target_user_id::text
  );

  DELETE FROM public.daily_activity WHERE user_id::text = target_user_id::text;
  DELETE FROM public.sessions       WHERE user_id::text = target_user_id::text;
  DELETE FROM public.notes          WHERE user_id::text = target_user_id::text;
  DELETE FROM public.projects       WHERE user_id::text = target_user_id::text;
  DELETE FROM public.courses        WHERE user_id::text = target_user_id::text;
  DELETE FROM public.roadmaps       WHERE user_id::text = target_user_id::text;
  DELETE FROM public.profiles       WHERE id = target_user_id;

  -- This also fires on_auth_user_deleted below (harmless no-op by then, since
  -- everything above is already gone) — it's the safety net for the case
  -- where this RPC isn't the thing that deleted the user.
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


-- ── 6. TRIGGER: guaranteed cleanup no matter how a user is deleted ───────────
-- Replaces the old "ALTER COLUMN user_id TYPE UUID + ON DELETE CASCADE" attempt,
-- which silently failed (see note at the top of this file). This trigger fires
-- on ANY deletion from auth.users and doesn't depend on user_id's column type.
CREATE OR REPLACE FUNCTION public.cleanup_user_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.topics WHERE course_id IN (
    SELECT id FROM public.courses WHERE user_id::text = OLD.id::text
  );

  DELETE FROM public.daily_activity WHERE user_id::text = OLD.id::text;
  DELETE FROM public.sessions       WHERE user_id::text = OLD.id::text;
  DELETE FROM public.notes          WHERE user_id::text = OLD.id::text;
  DELETE FROM public.projects       WHERE user_id::text = OLD.id::text;
  DELETE FROM public.courses        WHERE user_id::text = OLD.id::text;
  DELETE FROM public.roadmaps       WHERE user_id::text = OLD.id::text;
  DELETE FROM public.profiles       WHERE id = OLD.id;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_user_data();


-- ── 7. One-time sweep: purge orphans already left behind by past deletions ───
DELETE FROM public.topics
WHERE course_id IN (
  SELECT c.id FROM public.courses c
  LEFT JOIN auth.users u ON u.id::text = c.user_id::text
  WHERE u.id IS NULL AND c.user_id NOT IN ('local', 'local-bedo')
);

DELETE FROM public.daily_activity da
WHERE da.user_id NOT IN ('local', 'local-bedo')
  AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id::text = da.user_id::text);

DELETE FROM public.sessions s
WHERE s.user_id NOT IN ('local', 'local-bedo')
  AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id::text = s.user_id::text);

DELETE FROM public.notes n
WHERE n.user_id NOT IN ('local', 'local-bedo')
  AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id::text = n.user_id::text);

DELETE FROM public.projects p
WHERE p.user_id NOT IN ('local', 'local-bedo')
  AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id::text = p.user_id::text);

DELETE FROM public.courses c
WHERE c.user_id NOT IN ('local', 'local-bedo')
  AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id::text = c.user_id::text);

DELETE FROM public.roadmaps r
WHERE r.user_id NOT IN ('local', 'local-bedo')
  AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id::text = r.user_id::text);


-- ── 8. Verify: should return 0 orphaned rows in every table ──────────────────
SELECT 'courses' AS table_name, COUNT(*) AS orphaned FROM public.courses c
  WHERE c.user_id NOT IN ('local', 'local-bedo') AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id::text = c.user_id::text)
UNION ALL
SELECT 'notes', COUNT(*) FROM public.notes n
  WHERE n.user_id NOT IN ('local', 'local-bedo') AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id::text = n.user_id::text)
UNION ALL
SELECT 'sessions', COUNT(*) FROM public.sessions s
  WHERE s.user_id NOT IN ('local', 'local-bedo') AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id::text = s.user_id::text)
UNION ALL
SELECT 'projects', COUNT(*) FROM public.projects p
  WHERE p.user_id NOT IN ('local', 'local-bedo') AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id::text = p.user_id::text)
UNION ALL
SELECT 'roadmaps', COUNT(*) FROM public.roadmaps r
  WHERE r.user_id NOT IN ('local', 'local-bedo') AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id::text = r.user_id::text);


-- ── 9. Smoke-test: View all users and their confirmation status ──────────────
SELECT * FROM public.list_all_users();
