-- =============================================================================
--  Bedo Courses Dashboard — Cloud-Only State
--  Run in: Supabase Dashboard → SQL Editor
--  Idempotent — safe to re-run.
--  Run this AFTER supabase_migration.sql, supabase_user_mgmt.sql and
--  supabase_admin_security.sql.
-- =============================================================================
--
--  WHY
--  ---
--  Until now, three things lived ONLY in the browser's localStorage and were
--  never tied to an account:
--    • the D3 roadmap canvas (nodes, edges, active template, custom templates)
--    • which notifications you'd read or dismissed
--    • your chosen theme
--  Because they belonged to the *device* and not to a *person*, a brand-new
--  signup on a browser that had been used before inherited the previous
--  roadmap, and your own roadmap vanished if you opened the site on your
--  phone. This table gives all of it a real per-account home, so everything
--  follows the account across devices.
--
--  The app now reads these from here. localStorage is no longer a source of
--  truth anywhere in the app.
-- =============================================================================


-- ── 1. Per-account key/value state ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_state (
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key        TEXT        NOT NULL,
  value      JSONB       NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, key)
);

COMMENT ON TABLE public.user_state IS
  'Per-account app state that has no table of its own. Keys in use: roadmap_canvas, notifications, preferences.';

CREATE INDEX IF NOT EXISTS user_state_user_idx ON public.user_state (user_id);


-- ── 2. Row Level Security: you can only ever touch your own row ──────────────
ALTER TABLE public.user_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_state_owner ON public.user_state;
CREATE POLICY user_state_owner ON public.user_state
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_state TO authenticated;
REVOKE ALL ON public.user_state FROM anon;


-- ── 3. Keep it in the deletion paths ─────────────────────────────────────────
-- The FK above already cascades, but delete_user_complete() removes rows
-- itself before dropping the auth user, so it needs to know about this table.
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
  IF auth.uid() IS NOT NULL
     AND NOT public.is_admin()
     AND auth.uid() <> target_user_id THEN
    RETURN jsonb_build_object('deleted', false, 'error', 'Not authorised: admin access required.');
  END IF;

  SELECT email, name INTO v_email, v_name
    FROM public.profiles WHERE id = target_user_id;

  DELETE FROM public.topics WHERE course_id IN (
    SELECT id FROM public.courses WHERE user_id::text = target_user_id::text
  );
  DELETE FROM public.user_state     WHERE user_id = target_user_id;
  DELETE FROM public.daily_activity WHERE user_id::text = target_user_id::text;
  DELETE FROM public.sessions       WHERE user_id::text = target_user_id::text;
  DELETE FROM public.notes          WHERE user_id::text = target_user_id::text;
  DELETE FROM public.projects       WHERE user_id::text = target_user_id::text;
  DELETE FROM public.courses        WHERE user_id::text = target_user_id::text;
  DELETE FROM public.roadmaps       WHERE user_id::text = target_user_id::text;
  DELETE FROM public.profiles       WHERE id = target_user_id;

  DELETE FROM auth.users WHERE id = target_user_id;

  RETURN jsonb_build_object('deleted', true, 'user_id', target_user_id,
                            'email', v_email, 'name', v_name);
EXCEPTION
  WHEN others THEN
    RETURN jsonb_build_object('deleted', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_complete(UUID) TO authenticated, service_role;

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
  DELETE FROM public.user_state     WHERE user_id = OLD.id;
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


-- ── 4. Clear out the old placeholder rows ────────────────────────────────────
-- The app used to write rows with the literal user_id 'local' when nobody was
-- signed in. Nothing writes those any more, and they belong to no account, so
-- they are removed. (Comment this section out if you'd rather keep them.)
DELETE FROM public.topics WHERE course_id IN (
  SELECT id FROM public.courses WHERE user_id IN ('local', 'local-bedo')
);
DELETE FROM public.daily_activity WHERE user_id IN ('local', 'local-bedo');
DELETE FROM public.sessions       WHERE user_id IN ('local', 'local-bedo');
DELETE FROM public.notes          WHERE user_id IN ('local', 'local-bedo');
DELETE FROM public.projects       WHERE user_id IN ('local', 'local-bedo');
DELETE FROM public.courses        WHERE user_id IN ('local', 'local-bedo');
DELETE FROM public.roadmaps       WHERE user_id IN ('local', 'local-bedo');


-- ── 5. Verify ────────────────────────────────────────────────────────────────
SELECT 'user_state exists' AS check, COUNT(*) AS rows FROM public.user_state;

SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('profiles','roadmaps','courses','topics','notes','projects','sessions','daily_activity','user_state')
ORDER BY c.relname;
