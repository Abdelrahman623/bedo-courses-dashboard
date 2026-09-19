-- =============================================================================
-- Bedo Courses Dashboard — Supabase Database Migration v2
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/wfnbaibpegcqqlonphmy/sql/new
-- NOTE: This script is idempotent — safe to re-run.
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. PROFILES
--    id = auth.users.id (no DEFAULT — must be explicitly provided)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id                UUID PRIMARY KEY,
  name              TEXT NOT NULL DEFAULT 'Bedo',
  username          TEXT UNIQUE,
  email             TEXT,
  avatar_url        TEXT,
  bio               TEXT,
  weekly_goal_hours INTEGER NOT NULL DEFAULT 10,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all columns exist (safe for tables already created)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weekly_goal_hours INTEGER DEFAULT 10;

-- Remove the accidental DEFAULT on id if it exists
ALTER TABLE public.profiles ALTER COLUMN id DROP DEFAULT;

-- Add unique constraint on username if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_username_key' AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
  END IF;
END$$;

-- Foreign key to auth.users with ON DELETE CASCADE
-- (Deleting a user in Supabase Authentication immediately purges their public.profiles row)
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

-- Index for fast case-insensitive username lookups
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (LOWER(username));

-- =============================================================================
-- 2. ROADMAPS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.roadmaps (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     TEXT NOT NULL DEFAULT 'local',
  title       TEXT NOT NULL,
  description TEXT,
  image_url   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 3. COURSES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.courses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     TEXT NOT NULL DEFAULT 'local',
  roadmap_id  UUID REFERENCES public.roadmaps(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  source_url  TEXT,
  start_date  DATE,
  status      TEXT NOT NULL DEFAULT 'not_started'
                CHECK (status IN ('not_started','in_progress','completed','paused')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 4. TOPICS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.topics (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id       UUID REFERENCES courses(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  parent_topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  position_x      FLOAT,
  position_y      FLOAT,
  phase           TEXT,
  status          TEXT NOT NULL DEFAULT 'not_started'
                    CHECK (status IN ('not_started','in_progress','completed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 5. NOTES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.notes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    TEXT NOT NULL DEFAULT 'local',
  course_id  UUID REFERENCES courses(id) ON DELETE SET NULL,
  topic_id   UUID REFERENCES topics(id) ON DELETE SET NULL,
  title      TEXT NOT NULL DEFAULT 'Untitled Note',
  content    TEXT NOT NULL DEFAULT '',
  tags       TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notes_fts ON public.notes USING gin(to_tsvector('english', title || ' ' || content));

-- =============================================================================
-- 6. PROJECTS
-- =============================================================================
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

-- =============================================================================
-- 7. SESSIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.sessions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       TEXT NOT NULL DEFAULT 'local',
  course_id     UUID REFERENCES courses(id) ON DELETE SET NULL,
  topic_id      UUID REFERENCES topics(id) ON DELETE SET NULL,
  start_time    TIMESTAMPTZ NOT NULL,
  end_time      TIMESTAMPTZ,
  duration_mins INTEGER NOT NULL DEFAULT 0,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 8. DAILY ACTIVITY
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.daily_activity (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          TEXT NOT NULL DEFAULT 'local',
  date             DATE NOT NULL,
  total_mins       INTEGER NOT NULL DEFAULT 0,
  topics_completed INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- =============================================================================
-- 9. DISABLE ROW LEVEL SECURITY (personal dashboard — open access)
-- =============================================================================
ALTER TABLE public.profiles      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmaps      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses       DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics        DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes         DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_activity DISABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 10. GRANT FULL PERMISSIONS TO ALL ROLES
-- =============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- =============================================================================
-- 11. USERNAME LOOKUP RPC FUNCTION
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_email_by_username(p_username TEXT)
RETURNS TEXT AS $$
  SELECT email FROM public.profiles
  WHERE LOWER(username) = LOWER(TRIM(p_username))
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_email_by_username(TEXT) TO anon, authenticated, service_role;

-- =============================================================================
-- 12. AUTO-CREATE PROFILE TRIGGER (fires on auth.users INSERT)
-- =============================================================================
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
-- 13. VERIFICATION — view current users and profiles
-- =============================================================================
SELECT
  u.id,
  u.email              AS auth_email,
  u.created_at         AS signed_up_at,
  p.id                 AS profile_id,
  p.email              AS profile_email,
  p.username,
  p.name
FROM auth.users u
FULL OUTER JOIN public.profiles p ON p.id = u.id
ORDER BY u.created_at DESC;
