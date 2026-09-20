-- =============================================================================
--  Bedo Courses Dashboard — Admin Roles + Row Level Security Lockdown
--  Run in: Supabase Dashboard → SQL Editor
--  Idempotent — safe to re-run any number of times.
--  Run this AFTER supabase_migration.sql and supabase_user_mgmt.sql.
-- =============================================================================
--
--  WHAT THIS FIXES
--  ---------------
--  Before this script, your database was completely open:
--    • Row Level Security was DISABLED on every table, and `anon` had ALL
--      privileges — so anyone who opened your site, pulled the Supabase URL +
--      anon key out of the shipped JavaScript (always visible, that's normal),
--      and typed one line into their browser console could read, edit, or
--      delete ANY user's notes, courses, sessions and projects.
--    • list_all_users / delete_user_complete / confirm_user were granted to
--      `anon`, meaning anyone — not even logged in — could list every account
--      on your site and delete them. Hiding the Settings tab in the UI would
--      NOT have stopped that; it's fixed here, at the database.
--
--  AFTER this script:
--    • Every table is protected: a logged-in user can only ever touch rows
--      that belong to them. Admins can read everything.
--    • Admin is a real column in the database — public.profiles.is_admin —
--      so YOU decide who is an admin, straight from Supabase. See SECTION 9
--      at the bottom for how to promote someone.
--    • Nobody can promote themselves: a trigger blocks any change to is_admin
--      unless it's made by an existing admin or from the SQL Editor.
--
-- =============================================================================


-- ── 1. The admin flag lives in the database ──────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.profiles.is_admin IS
  'TRUE = this account can manage users. Set it from the SQL Editor or the Table Editor. Users cannot set it on themselves.';


-- ── 2. Helper: is the CURRENT caller an admin? ───────────────────────────────
-- SECURITY DEFINER so it can read profiles regardless of the caller's own
-- permissions — this is also what stops the profiles policies below from
-- recursing into themselves.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT p.is_admin FROM public.profiles p WHERE p.id = auth.uid()),
    FALSE
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon, service_role;


-- ── 3. Nobody can promote themselves ─────────────────────────────────────────
-- Without this, the "users can update their own profile" policy in section 6
-- would let anyone flip their own is_admin to TRUE from the browser console.
-- auth.uid() IS NULL means the change is coming from the SQL Editor / service
-- role / Table Editor — that's you, so it's allowed.
CREATE OR REPLACE FUNCTION public.guard_is_admin_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Not allowed: only an existing admin can change admin status.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_guard_is_admin ON public.profiles;
CREATE TRIGGER tr_guard_is_admin
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_is_admin_column();

-- Same guard on INSERT: a new signup can never arrive already-admin.
CREATE OR REPLACE FUNCTION public.guard_is_admin_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_admin AND auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    NEW.is_admin := FALSE;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_guard_is_admin_insert ON public.profiles;
CREATE TRIGGER tr_guard_is_admin_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_is_admin_insert();


-- ── 4. Take away the blanket `anon` access granted by the first migration ────
-- supabase_migration.sql ran "GRANT ALL PRIVILEGES ... TO anon", which is what
-- made the whole database world-writable. Logged-out visitors need no table
-- access at all: login and signup go through SECURITY DEFINER functions.
REVOKE ALL PRIVILEGES ON ALL TABLES    IN SCHEMA public FROM anon;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES    FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;

-- Logged-in users keep table-level access; RLS in section 5-7 decides which
-- ROWS they can actually see or change.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;


-- ── 5. Turn Row Level Security ON everywhere ─────────────────────────────────
ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmaps       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_activity ENABLE ROW LEVEL SECURITY;


-- ── 6. Policies: profiles ────────────────────────────────────────────────────
DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS profiles_insert ON public.profiles;
CREATE POLICY profiles_insert ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS profiles_delete ON public.profiles;
CREATE POLICY profiles_delete ON public.profiles
  FOR DELETE TO authenticated
  USING (public.is_admin());


-- ── 7. Policies: all user-owned data tables ──────────────────────────────────
-- user_id is TEXT in this schema (it defaults to the literal 'local'), so the
-- comparison is done as text on both sides — this works whether the column is
-- TEXT or UUID, which is why the earlier cascade attempt's type conversion is
-- not needed here.
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['roadmaps','courses','notes','projects','sessions','daily_activity']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_owner ON public.%I', t, t);
    EXECUTE format($f$
      CREATE POLICY %I_owner ON public.%I
        FOR ALL TO authenticated
        USING (user_id::text = auth.uid()::text OR public.is_admin())
        WITH CHECK (user_id::text = auth.uid()::text)
    $f$, t, t);
  END LOOP;
END $$;

-- topics has no user_id of its own — ownership is resolved through its course.
DROP POLICY IF EXISTS topics_owner ON public.topics;
CREATE POLICY topics_owner ON public.topics
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = topics.course_id
        AND c.user_id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = topics.course_id
        AND c.user_id::text = auth.uid()::text
    )
  );


-- ── 8. Lock down the user-management RPCs ────────────────────────────────────
-- These were granted to `anon`, i.e. callable by anyone on the internet.
REVOKE ALL ON FUNCTION public.list_all_users()            FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.delete_user_complete(UUID)  FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.confirm_user(UUID)          FROM anon, PUBLIC;

-- 8a. list_all_users — admins only (was LANGUAGE sql, now plpgsql so it can check)
DROP FUNCTION IF EXISTS public.list_all_users();
CREATE OR REPLACE FUNCTION public.list_all_users()
RETURNS TABLE(
  user_id        UUID,
  email          TEXT,
  name           TEXT,
  username       TEXT,
  created_at     TIMESTAMPTZ,
  is_confirmed   BOOLEAN,
  is_admin       BOOLEAN,
  notes_count    BIGINT,
  sessions_count BIGINT,
  projects_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorised: admin access required.';
  END IF;

  RETURN QUERY
  SELECT
    u.id                                            AS user_id,
    u.email::TEXT,
    COALESCE(p.name, split_part(u.email, '@', 1))::TEXT AS name,
    p.username::TEXT,
    u.created_at,
    (u.email_confirmed_at IS NOT NULL)              AS is_confirmed,
    COALESCE(p.is_admin, FALSE)                     AS is_admin,
    (SELECT COUNT(*) FROM public.notes    n  WHERE n.user_id::text  = u.id::text),
    (SELECT COUNT(*) FROM public.sessions s  WHERE s.user_id::text  = u.id::text),
    (SELECT COUNT(*) FROM public.projects pr WHERE pr.user_id::text = u.id::text)
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  ORDER BY u.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_all_users() TO authenticated, service_role;

-- 8b. delete_user_complete — admins, or a user deleting their own account
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

-- 8c. confirm_user — admins only
CREATE OR REPLACE FUNCTION public.confirm_user(target_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorised: admin access required.');
  END IF;

  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
  WHERE id = target_user_id;

  RETURN jsonb_build_object('success', true, 'user_id', target_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_user(UUID) TO authenticated, service_role;

-- 8d. set_user_admin — lets an admin promote/demote from inside the app
CREATE OR REPLACE FUNCTION public.set_user_admin(target_user_id UUID, make_admin BOOLEAN)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorised: admin access required.');
  END IF;

  IF auth.uid() = target_user_id AND make_admin = FALSE THEN
    RETURN jsonb_build_object('success', false, 'error', 'You cannot remove your own admin access.');
  END IF;

  UPDATE public.profiles SET is_admin = make_admin WHERE id = target_user_id;

  RETURN jsonb_build_object('success', true, 'user_id', target_user_id, 'is_admin', make_admin);
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_user_admin(UUID, BOOLEAN) TO authenticated, service_role;


-- ── 9. Signup / login helpers that must work while logged OUT ────────────────
-- With RLS on, the login page can no longer read public.profiles directly.
-- These SECURITY DEFINER functions expose exactly the yes/no answers the login
-- screen needs — and nothing else. No email addresses, no user list.
CREATE OR REPLACE FUNCTION public.username_exists(p_username TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE LOWER(username) = LOWER(TRIM(p_username))
  );
$$;

GRANT EXECUTE ON FUNCTION public.username_exists(TEXT) TO anon, authenticated, service_role;

-- get_email_by_username already exists and is SECURITY DEFINER; just make sure
-- it survives the anon revoke above.
GRANT EXECUTE ON FUNCTION public.get_email_by_username(TEXT) TO anon, authenticated, service_role;


-- =============================================================================
--  10. ⚠️  MAKE YOURSELF AN ADMIN — DO THIS NOW, OR NOBODY IS AN ADMIN
-- =============================================================================
--  Everyone defaults to is_admin = FALSE, including you. Uncomment ONE of the
--  two lines below, put your own email or username in, and run it.
--
--    UPDATE public.profiles SET is_admin = TRUE WHERE email    = 'your@email.com';
--    UPDATE public.profiles SET is_admin = TRUE WHERE username = 'your_username';
--
--  To add another admin later, just run that line again with their email.
--  To remove one:
--    UPDATE public.profiles SET is_admin = FALSE WHERE email = 'them@email.com';
--
--  You can also do it with no SQL at all:
--    Supabase Dashboard → Table Editor → profiles → find the row →
--    tick the is_admin checkbox → save.
-- =============================================================================


-- ── 11. Verify ───────────────────────────────────────────────────────────────
-- (a) Who is an admin right now?
SELECT id, email, username, is_admin
FROM public.profiles
ORDER BY is_admin DESC, email;

-- (b) Every table should read rls_enabled = true
SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('profiles','roadmaps','courses','topics','notes','projects','sessions','daily_activity')
ORDER BY c.relname;
