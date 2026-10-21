-- =============================================================================
--  SUPABASE FIX: GLOBAL ACADEMIC MODE CONTROL FOR ALL USERS
-- =============================================================================
--  Run this entire script in Supabase SQL Editor.
--  It is completely safe, idempotent, and configures the system-wide
--  academic mode toggle with real-time broadcast to all users.
-- =============================================================================

-- 1. Ensure public.profiles has is_admin column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
END $$;

-- 2. Ensure public.is_admin() function exists and runs safely
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT COALESCE(
    (SELECT p.is_admin FROM public.profiles p WHERE p.id = auth.uid()),
    FALSE
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon, service_role;

-- 3. Create public.system_settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Full replica identity so real-time events send the full row
ALTER TABLE public.system_settings REPLICA IDENTITY FULL;

-- Enable Row Level Security
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- SELECT: All users (authenticated and visitors) can read system settings
DROP POLICY IF EXISTS system_settings_read ON public.system_settings;
CREATE POLICY system_settings_read ON public.system_settings
  FOR SELECT TO authenticated, anon
  USING (true);

-- INSERT: Only admins can insert system settings
DROP POLICY IF EXISTS system_settings_admin_insert ON public.system_settings;
CREATE POLICY system_settings_admin_insert ON public.system_settings
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- UPDATE: Only admins can update system settings
DROP POLICY IF EXISTS system_settings_admin_update ON public.system_settings;
CREATE POLICY system_settings_admin_update ON public.system_settings
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. Permissions
GRANT SELECT ON TABLE public.system_settings TO anon, authenticated;
GRANT ALL ON TABLE public.system_settings TO authenticated, service_role;

-- 6. Seed default academic_mode_enabled = true if not already present
INSERT INTO public.system_settings (key, value)
VALUES ('academic_mode_enabled', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 7. RPC function: set_academic_mode
-- Runs with SECURITY DEFINER so that admin check is validated cleanly
CREATE OR REPLACE FUNCTION public.set_academic_mode(enabled BOOLEAN)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Not authorised: your account does not have admin permissions in public.profiles.'
    );
  END IF;

  INSERT INTO public.system_settings (key, value, updated_by, updated_at)
  VALUES ('academic_mode_enabled', to_jsonb(enabled), auth.uid(), NOW())
  ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value,
        updated_by = EXCLUDED.updated_by,
        updated_at = EXCLUDED.updated_at;

  RETURN jsonb_build_object('success', true, 'enabled', enabled);
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_academic_mode(BOOLEAN) TO authenticated, service_role;

-- 8. RPC function: get_academic_mode (direct read fallback)
CREATE OR REPLACE FUNCTION public.get_academic_mode()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT COALESCE(
    (SELECT (value = 'true'::jsonb OR value = '"true"'::jsonb) FROM public.system_settings WHERE key = 'academic_mode_enabled'),
    TRUE
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_academic_mode() TO authenticated, anon, service_role;

-- 9. Add system_settings to Supabase Realtime publication
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'system_settings'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.system_settings;
    END IF;
  END IF;
END $$;

-- =============================================================================
--  MAKE YOUR ACCOUNT ADMIN (REPLACE WITH YOUR EMAIL IF NOT ALREADY ADMIN)
-- =============================================================================
--  UPDATE public.profiles SET is_admin = TRUE WHERE email = 'your-email@example.com';
-- =============================================================================
