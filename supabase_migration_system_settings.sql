-- ============================================================
-- Migration: Global System Settings & Academic Mode Control
-- Idempotent: safe to run once or re-run any time.
-- ============================================================

-- 1. Create system_settings table for global app-wide configuration
CREATE TABLE IF NOT EXISTS public.system_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure full row is sent on UPDATE events in Supabase Realtime
ALTER TABLE public.system_settings REPLICA IDENTITY FULL;

-- 2. Row Level Security
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Everyone (authenticated and anon) can read system settings
DROP POLICY IF EXISTS system_settings_read ON public.system_settings;
CREATE POLICY system_settings_read ON public.system_settings
  FOR SELECT TO authenticated, anon
  USING (true);

-- Only admins can insert or update system settings
DROP POLICY IF EXISTS system_settings_admin_insert ON public.system_settings;
CREATE POLICY system_settings_admin_insert ON public.system_settings
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS system_settings_admin_update ON public.system_settings;
CREATE POLICY system_settings_admin_update ON public.system_settings
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. Permissions
GRANT SELECT ON TABLE public.system_settings TO anon, authenticated;
GRANT ALL ON TABLE public.system_settings TO authenticated, service_role;

-- 4. Seed default academic_mode_enabled = true if not already present
INSERT INTO public.system_settings (key, value)
VALUES ('academic_mode_enabled', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 5. RPC function to allow admins to set academic mode safely (bypasses RLS via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.set_academic_mode(enabled BOOLEAN)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorised: admin access required.');
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

-- 6. Add system_settings to realtime publication for instant zero-refresh sync
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication
    WHERE pubname = 'supabase_realtime'
      AND NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'system_settings'
      )
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.system_settings;
  END IF;
END $$;
