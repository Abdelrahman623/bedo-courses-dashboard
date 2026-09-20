-- =============================================================================
--  Bedo Courses Dashboard — Fix: deleted users leaving orphaned data
--  Run in: Supabase Dashboard → SQL Editor
--  Run this AFTER supabase_migration.sql and supabase_user_mgmt.sql have
--  already been applied. Idempotent — safe to re-run.
-- =============================================================================
--
--  Root cause:
--   1) courses/topics/notes/projects/sessions/roadmaps/daily_activity store
--      user_id as plain TEXT with no foreign key to auth.users at all in the
--      original schema.
--   2) supabase_user_mgmt.sql tried to fix that by converting user_id to UUID
--      and adding ON DELETE CASCADE, but wrapped each ALTER in
--      "EXCEPTION WHEN others THEN NULL", which silently swallows any
--      failure — including the near-guaranteed failure of casting the
--      literal default value 'local' to UUID. So the cascade most likely
--      never actually got created, with no error shown anywhere.
--   3) delete_user_complete() also never explicitly deleted `topics` — it
--      relied entirely on courses' ON DELETE CASCADE to topics, which is
--      fine when the RPC is used, but does nothing if a user is deleted any
--      other way (e.g. directly from the Supabase Dashboard's
--      Authentication tab), since that only removes the auth.users row.
--
--  Fix: a trigger on auth.users that fires on ANY deletion of a user — via
--  this app's RPC, the Dashboard, or the Admin API — and guarantees every
--  related row is purged. This does NOT depend on user_id being UUID typed,
--  so it works regardless of whether the earlier ALTER succeeded.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_user_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Topics belonging to this user's courses (courses has no direct user_id
  -- link for topics, so resolve via course_id first).
  DELETE FROM public.topics
  WHERE course_id IN (
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

-- ── Also make delete_user_complete() explicitly purge topics ────────────────
-- (defense in depth — the trigger above now guarantees this too, since
-- deleting from auth.users at the end of this function fires the trigger,
-- but topics are removed explicitly first so the RPC's own success/error
-- reporting reflects the real outcome even if the trigger were ever removed)
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

  -- This fires the on_auth_user_deleted trigger too (harmless no-op by then,
  -- since everything above is already gone) — it's the safety net for users
  -- deleted any other way.
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

-- ── One-time sweep: clean up any orphans that already exist from past ───────
--    deletions that happened before this trigger existed.
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

-- ── Verify: should return 0 rows if everything is now clean ─────────────────
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
