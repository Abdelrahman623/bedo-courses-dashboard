-- =============================================================================
--  Bedo Courses Dashboard — Complete Database Setup (single file)
--  Run in: Supabase Dashboard → SQL Editor → New query
--  Idempotent — safe to run once, or to re-run any time in the future.
--  This file replaces: supabase_migration.sql, supabase_user_mgmt.sql,
--  supabase_admin_security.sql, supabase_cloud_state.sql — you only need
--  this one going forward. Delete the other four once this has run cleanly.
-- =============================================================================
--
--  WHAT THIS SETS UP, IN ORDER
--  ----------------------------
--  1. Extensions
--  2. Tables: profiles, roadmaps, courses, topics, notes, projects, sessions,
--     daily_activity, user_state
--  3. Auth: auto-confirm new signups, username→email lookup, auto-create
--     profile row on signup
--  4. Admin role: profiles.is_admin, with a trigger so nobody can promote
--     themselves — only you, from the SQL Editor, or an existing admin
--  5. Row Level Security on every table, so an account can only ever read or
--     write its own rows (admins can read everything)
--  6. User-management functions (list/confirm/delete/promote users),
--     restricted to admins, with full cascade cleanup on delete
--  7. One-time cleanup of old ownerless 'local' rows left over from before
--     accounts existed
--  8. Verification queries at the very end
--
--  WHAT TO DO AFTER RUNNING THIS
--  ------------------------------
--  Scroll down to SECTION 10 and run the UPDATE line with your own email —
--  that is what makes you an admin. Nothing else does this automatically.
-- =============================================================================


-- =============================================================================
-- SECTION 1 — EXTENSIONS
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- =============================================================================
-- SECTION 2 — TABLES
-- =============================================================================

-- ── 2a. profiles ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id                UUID PRIMARY KEY,
  name              TEXT NOT NULL DEFAULT 'Bedo',
  username          TEXT UNIQUE,
  email             TEXT,
  avatar_url        TEXT,
  bio               TEXT,
  weekly_goal_hours INTEGER NOT NULL DEFAULT 10,
  is_admin          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weekly_goal_hours INTEGER DEFAULT 10;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.profiles.is_admin IS
  'TRUE = this account can manage users. Set it from the SQL Editor or the Table Editor. Users cannot set it on themselves.';

ALTER TABLE public.profiles ALTER COLUMN id DROP DEFAULT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_username_key' AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
  END IF;
END$$;

DO $$
BEGIN
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_id_fkey
    FOREIGN KEY (id) REFERENCES auth.users(id)
    ON DELETE CASCADE;
EXCEPTION
  WHEN others THEN NULL;
END$$;

CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (LOWER(username));

-- ── 2b. roadmaps ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.roadmaps (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     TEXT NOT NULL DEFAULT 'local',
  title       TEXT NOT NULL,
  description TEXT,
  image_url   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2c. courses ───────────────────────────────────────────────────────────
-- roadmap_id is TEXT, not a real FK: the app stamps it with the frontend
-- template's own string key ("data-analyst", "full-stack", ...) to remember
-- which built-in roadmap a course came from — it was never meant to point
-- at a row in the (effectively unused) `roadmaps` table, which only has
-- real UUID ids. Typing it as UUID made every template enrollment fail.
CREATE TABLE IF NOT EXISTS public.courses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     TEXT NOT NULL DEFAULT 'local',
  roadmap_id  TEXT,
  title       TEXT NOT NULL,
  source_url  TEXT,
  start_date  DATE,
  status      TEXT NOT NULL DEFAULT 'not_started'
                CHECK (status IN ('not_started','in_progress','completed','paused')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2d. topics ────────────────────────────────────────────────────────────
-- id is TEXT, not UUID: the roadmap canvas assigns its own human-readable
-- ids (template slugs like "frontend", or "css-basics_a1b2" for topics added
-- in-app), and Postgres rejects those as invalid input for a UUID column.
-- The DEFAULT below is just a safety net for rows inserted without an id.
CREATE TABLE IF NOT EXISTS public.topics (
  id              TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  course_id       UUID REFERENCES courses(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  parent_topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL,
  position_x      FLOAT,
  position_y      FLOAT,
  phase           TEXT,
  status          TEXT NOT NULL DEFAULT 'not_started'
                    CHECK (status IN ('not_started','in_progress','completed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2e. notes ─────────────────────────────────────────────────────────────
-- note_type / project_id: the app's Note type has always expected these
-- (used for linked notes — course, topic or project), but the original
-- table never had them, so any linked note insert failed silently.
CREATE TABLE IF NOT EXISTS public.notes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    TEXT NOT NULL DEFAULT 'local',
  course_id  UUID REFERENCES courses(id) ON DELETE SET NULL,
  topic_id   TEXT REFERENCES topics(id) ON DELETE SET NULL,
  project_id UUID,
  note_type  TEXT NOT NULL DEFAULT 'general'
               CHECK (note_type IN ('general','linked')),
  title      TEXT NOT NULL DEFAULT 'Untitled Note',
  content    TEXT NOT NULL DEFAULT '',
  tags       TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notes_fts ON public.notes USING gin(to_tsvector('english', title || ' ' || content));

-- ── 2f. projects ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.projects (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        TEXT NOT NULL DEFAULT 'local',
  course_id      UUID REFERENCES courses(id) ON DELETE SET NULL,
  type           TEXT NOT NULL DEFAULT 'independent'
                   CHECK (type IN ('course','independent')),
  title          TEXT NOT NULL,
  description    TEXT,
  status         TEXT NOT NULL DEFAULT 'idea'
                   CHECK (status IN ('idea','in_progress','completed','deployed')),
  tech_stack     TEXT[] NOT NULL DEFAULT '{}',
  github_url     TEXT,
  demo_url       TEXT,
  local_path     TEXT,
  completion_pct INTEGER NOT NULL DEFAULT 0 CHECK (completion_pct BETWEEN 0 AND 100),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2g. sessions ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sessions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       TEXT NOT NULL DEFAULT 'local',
  course_id     UUID REFERENCES courses(id) ON DELETE SET NULL,
  topic_id      TEXT REFERENCES topics(id) ON DELETE SET NULL,
  start_time    TIMESTAMPTZ NOT NULL,
  end_time      TIMESTAMPTZ,
  duration_mins INTEGER NOT NULL DEFAULT 0,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2h. daily_activity ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_activity (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          TEXT NOT NULL DEFAULT 'local',
  date             DATE NOT NULL,
  total_mins       INTEGER NOT NULL DEFAULT 0,
  topics_completed INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ── 2i. user_state — per-account app data with no table of its own ─────────
-- Holds: the D3 roadmap canvas, which notifications you've read/dismissed,
-- and your theme/preferences. All used to live only in the browser; now they
-- follow your account to any device.
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

-- ── 2j. fix-ups for databases created before this file's topics/notes
-- changes existed ─────────────────────────────────────────────────────────
-- CREATE TABLE IF NOT EXISTS above only affects a brand-new database. If
-- topics/notes/sessions were already created by an earlier version of this
-- script (topics.id as UUID), this block converts them in place. Runs after
-- every table in section 2 exists, and is safe to run again — each part
-- checks the current state before doing anything.

-- courses.roadmap_id: convert UUID -> TEXT only if still UUID (older
-- installs). Every template enrollment (addTemplateAsCourse) has always
-- tried to store a template key like "data-analyst" here, which is not a
-- valid UUID — this is why courses created from a template never actually
-- saved, even though the app appeared to accept them locally.
DO $$
DECLARE
  roadmap_id_is_uuid BOOLEAN;
BEGIN
  SELECT (data_type = 'uuid') INTO roadmap_id_is_uuid
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'courses' AND column_name = 'roadmap_id';

  IF roadmap_id_is_uuid THEN
    ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_roadmap_id_fkey;
    ALTER TABLE public.courses ALTER COLUMN roadmap_id TYPE TEXT USING roadmap_id::text;
  END IF;
END$$;

-- notes: add the missing columns if this table predates them.
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS project_id UUID;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS note_type TEXT NOT NULL DEFAULT 'general';
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'notes_note_type_check' AND conrelid = 'public.notes'::regclass
  ) THEN
    ALTER TABLE public.notes ADD CONSTRAINT notes_note_type_check
      CHECK (note_type IN ('general','linked'));
  END IF;
END$$;

-- notes.project_id -> projects(id): added now that projects definitely exists.
DO $$
BEGIN
  ALTER TABLE public.notes DROP CONSTRAINT IF EXISTS notes_project_id_fkey;
  ALTER TABLE public.notes
    ADD CONSTRAINT notes_project_id_fkey
    FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;
EXCEPTION
  WHEN others THEN NULL;
END$$;

-- topics.id / topics.parent_topic_id / notes.topic_id / sessions.topic_id:
-- convert UUID -> TEXT only if they're still UUID (older installs). The
-- roadmap assigns its own ids ("frontend", "css-basics_a1b2", ...), which
-- are not valid UUIDs, so every topic insert and every "link note to
-- milestone" was failing before this ran.
DO $$
DECLARE
  topics_id_is_uuid BOOLEAN;
BEGIN
  SELECT (data_type = 'uuid') INTO topics_id_is_uuid
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'topics' AND column_name = 'id';

  IF topics_id_is_uuid THEN
    -- Drop every FK that points at topics(id) before changing its type.
    ALTER TABLE public.topics DROP CONSTRAINT IF EXISTS topics_parent_topic_id_fkey;
    ALTER TABLE public.notes  DROP CONSTRAINT IF EXISTS notes_topic_id_fkey;
    ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_topic_id_fkey;

    -- Old UUID rows (if any ever inserted successfully) still cast cleanly to text.
    ALTER TABLE public.topics ALTER COLUMN id DROP DEFAULT;
    ALTER TABLE public.topics ALTER COLUMN id TYPE TEXT USING id::text;
    ALTER TABLE public.topics ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

    ALTER TABLE public.topics ALTER COLUMN parent_topic_id TYPE TEXT USING parent_topic_id::text;
    ALTER TABLE public.notes  ALTER COLUMN topic_id TYPE TEXT USING topic_id::text;
    ALTER TABLE public.sessions ALTER COLUMN topic_id TYPE TEXT USING topic_id::text;

    -- Re-add the FKs now that both sides are TEXT.
    ALTER TABLE public.topics
      ADD CONSTRAINT topics_parent_topic_id_fkey
      FOREIGN KEY (parent_topic_id) REFERENCES public.topics(id) ON DELETE SET NULL;
    ALTER TABLE public.notes
      ADD CONSTRAINT notes_topic_id_fkey
      FOREIGN KEY (topic_id) REFERENCES public.topics(id) ON DELETE SET NULL;
    ALTER TABLE public.sessions
      ADD CONSTRAINT sessions_topic_id_fkey
      FOREIGN KEY (topic_id) REFERENCES public.topics(id) ON DELETE SET NULL;
  END IF;
END$$;


-- =============================================================================
-- SECTION 3 — AUTH: auto-confirm, username lookup, auto-create profile
-- =============================================================================

-- ── 3a. Auto-confirm every new signup (skip the confirmation-email step) ────
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

-- Confirm any accounts created before this trigger existed.
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- ── 3b. Username → email lookup, for signing in with a username ────────────
CREATE OR REPLACE FUNCTION public.get_email_by_username(p_username TEXT)
RETURNS TEXT AS $$
  SELECT email FROM public.profiles
  WHERE LOWER(username) = LOWER(TRIM(p_username))
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- ── 3c. Username-taken check (used by signup; leaks nothing but a boolean) ──
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

-- ── 3d. Auto-create a profiles row whenever a new auth user signs up ────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_username TEXT;
  v_name TEXT;
BEGIN
  v_username := COALESCE(
    new.raw_user_meta_data->>'username',
    SPLIT_PART(new.email, '@', 1),
    'user'
  );
  v_name := COALESCE(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    v_username
  );

  INSERT INTO public.profiles (id, name, username, email)
  VALUES (
    new.id,
    v_name,
    LOWER(TRIM(v_username)),
    LOWER(TRIM(new.email))
  )
  ON CONFLICT (id) DO UPDATE SET
    email    = COALESCE(EXCLUDED.email,    public.profiles.email),
    username = COALESCE(EXCLUDED.username, public.profiles.username),
    name     = COALESCE(EXCLUDED.name,     public.profiles.name);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =============================================================================
-- SECTION 4 — ADMIN ROLE
-- =============================================================================

-- ── 4a. Is the CURRENT caller an admin? ──────────────────────────────────────
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

-- ── 4b. Nobody can promote themselves ────────────────────────────────────────
-- auth.uid() IS NULL means the change came from the SQL Editor / service role
-- / Table Editor — that's you, always allowed.
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


-- =============================================================================
-- SECTION 5 — ROW LEVEL SECURITY
-- =============================================================================

-- ── 5a. Take away blanket public access, keep it for signed-in users ────────
REVOKE ALL PRIVILEGES ON ALL TABLES    IN SCHEMA public FROM anon;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES    FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;

GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated, service_role;

-- Signed-out visitors need no table access at all — login/signup go through
-- the SECURITY DEFINER functions above, which is all they need.
GRANT EXECUTE ON FUNCTION public.is_admin()                    TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_email_by_username(TEXT)   TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.username_exists(TEXT)         TO anon, authenticated, service_role;

-- ── 5b. Turn RLS on everywhere ────────────────────────────────────────────
ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmaps       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_state     ENABLE ROW LEVEL SECURITY;

-- ── 5c. Policies: profiles ────────────────────────────────────────────────
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

-- ── 5d. Policies: user-owned data tables ─────────────────────────────────
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

-- topics has no user_id — ownership resolves through its course.
DROP POLICY IF EXISTS topics_owner ON public.topics;
CREATE POLICY topics_owner ON public.topics
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = topics.course_id AND c.user_id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = topics.course_id AND c.user_id::text = auth.uid()::text
    )
  );

-- ── 5e. Policies: user_state ──────────────────────────────────────────────
DROP POLICY IF EXISTS user_state_owner ON public.user_state;
CREATE POLICY user_state_owner ON public.user_state
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid());


-- =============================================================================
-- SECTION 6 — USER MANAGEMENT (admin-only)
-- =============================================================================

REVOKE ALL ON FUNCTION public.get_email_by_username(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_email_by_username(TEXT) TO anon, authenticated, service_role;

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
    u.id                                                 AS user_id,
    u.email::TEXT,
    COALESCE(p.name, split_part(u.email, '@', 1))::TEXT  AS name,
    p.username::TEXT,
    u.created_at,
    (u.email_confirmed_at IS NOT NULL)                   AS is_confirmed,
    COALESCE(p.is_admin, FALSE)                          AS is_admin,
    (SELECT COUNT(*) FROM public.notes    n  WHERE n.user_id::text  = u.id::text),
    (SELECT COUNT(*) FROM public.sessions s  WHERE s.user_id::text  = u.id::text),
    (SELECT COUNT(*) FROM public.projects pr WHERE pr.user_id::text = u.id::text)
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  ORDER BY u.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_all_users() TO authenticated, service_role;

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

-- Deletes a user everywhere: their courses, topics, notes, sessions, projects,
-- roadmaps, saved app state, and the auth account itself. Callable by an
-- admin, or by a user deleting their own account.
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

-- Guaranteed cleanup no matter HOW a user is deleted — the app's own button,
-- the Supabase Dashboard's Authentication tab, or the Admin API.
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


-- =============================================================================
-- SECTION 7 — ONE-TIME CLEANUP OF OLD OWNERLESS ROWS
-- =============================================================================
-- Before accounts existed, everything was written under the literal user_id
-- 'local'. Nothing writes those any more, and they belong to no account.
DELETE FROM public.topics WHERE course_id IN (
  SELECT id FROM public.courses WHERE user_id IN ('local', 'local-bedo')
);
DELETE FROM public.daily_activity WHERE user_id IN ('local', 'local-bedo');
DELETE FROM public.sessions       WHERE user_id IN ('local', 'local-bedo');
DELETE FROM public.notes          WHERE user_id IN ('local', 'local-bedo');
DELETE FROM public.projects       WHERE user_id IN ('local', 'local-bedo');
DELETE FROM public.courses        WHERE user_id IN ('local', 'local-bedo');
DELETE FROM public.roadmaps       WHERE user_id IN ('local', 'local-bedo');

-- Also purge any rows already orphaned from past deletions (accounts removed
-- before the trigger in Section 6 existed).
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


-- =============================================================================
-- SECTION 8 — VERIFICATION
-- =============================================================================

-- (a) Every table should show rls_enabled = true
SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('profiles','roadmaps','courses','topics','notes','projects',
                     'sessions','daily_activity','user_state')
ORDER BY c.relname;

-- (b) Who is an admin right now? (should be empty until you run Section 10)
SELECT id, email, username, is_admin
FROM public.profiles
ORDER BY is_admin DESC, email;

-- (c) Orphan check — every row here should read 0
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


-- =============================================================================
--  SECTION 9 — ⚠️  DO THIS NOW: MAKE YOURSELF AN ADMIN
-- =============================================================================
--  Everyone defaults to is_admin = FALSE, including you. Uncomment ONE line
--  below, put in your own email (the one you sign into the app with), and
--  run it. If it says "0 rows updated", sign up / log into the app with that
--  email first, then come back and run this.
--
--    UPDATE public.profiles SET is_admin = TRUE WHERE email = 'your@email.com';
--
--  To add another admin later, run that same line with their email.
--  To remove one:
--    UPDATE public.profiles SET is_admin = FALSE WHERE email = 'them@email.com';
--
--  Or with no SQL at all: Supabase Dashboard → Table Editor → profiles →
--  find the row → tick the is_admin checkbox → save.
-- =============================================================================
