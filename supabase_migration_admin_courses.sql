-- =============================================================================
--  MIGRATION: ADMIN FULL CONTROL OVER DEFAULT & USER COURSES + JSON EDITING
-- =============================================================================
--  Safe & idempotent script to run in Supabase SQL Editor.
-- =============================================================================

-- 1. Table for System Default Courses / Roadmap Templates
CREATE TABLE IF NOT EXISTS public.roadmap_templates (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  category     TEXT NOT NULL DEFAULT 'development',
  icon         TEXT NOT NULL DEFAULT 'Route',
  badge        TEXT NOT NULL DEFAULT 'Comprehensive',
  description  TEXT NOT NULL DEFAULT '',
  roadmap_url  TEXT NOT NULL DEFAULT '',
  nodes        JSONB NOT NULL DEFAULT '[]'::jsonb,
  edges        JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Full replica identity for real-time changes
ALTER TABLE public.roadmap_templates REPLICA IDENTITY FULL;
ALTER TABLE public.roadmap_templates ENABLE ROW LEVEL SECURITY;

-- 2. RLS Policies for roadmap_templates
DROP POLICY IF EXISTS roadmap_templates_read ON public.roadmap_templates;
CREATE POLICY roadmap_templates_read ON public.roadmap_templates
  FOR SELECT TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS roadmap_templates_admin_insert ON public.roadmap_templates;
CREATE POLICY roadmap_templates_admin_insert ON public.roadmap_templates
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS roadmap_templates_admin_update ON public.roadmap_templates;
CREATE POLICY roadmap_templates_admin_update ON public.roadmap_templates
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS roadmap_templates_admin_delete ON public.roadmap_templates;
CREATE POLICY roadmap_templates_admin_delete ON public.roadmap_templates
  FOR DELETE TO authenticated
  USING (public.is_admin());

GRANT SELECT ON TABLE public.roadmap_templates TO anon, authenticated;
GRANT ALL ON TABLE public.roadmap_templates TO authenticated, service_role;

-- 3. Update RLS policies on public.courses & public.topics to grant admins full editing & deletion
DROP POLICY IF EXISTS courses_owner ON public.courses;
CREATE POLICY courses_owner ON public.courses
  FOR ALL TO authenticated
  USING (user_id::text = auth.uid()::text OR public.is_admin())
  WITH CHECK (user_id::text = auth.uid()::text OR public.is_admin());

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
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = topics.course_id AND c.user_id::text = auth.uid()::text
    )
  );

-- 4. RPC: admin_list_all_courses
-- Returns all user courses across the platform tagged by user details
CREATE OR REPLACE FUNCTION public.admin_list_all_courses()
RETURNS TABLE (
  course_id              UUID,
  user_id                TEXT,
  user_name              TEXT,
  user_email             TEXT,
  user_username          TEXT,
  user_is_admin          BOOLEAN,
  title                  TEXT,
  mode                   TEXT,
  status                 TEXT,
  source                 TEXT,
  source_url             TEXT,
  start_date             DATE,
  roadmap_id             TEXT,
  created_at             TIMESTAMPTZ,
  topic_count            BIGINT,
  completed_topic_count  BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorised: admin access required.';
  END IF;

  RETURN QUERY
  SELECT
    c.id AS course_id,
    c.user_id::TEXT,
    COALESCE(p.name, split_part(u.email, '@', 1), 'User')::TEXT AS user_name,
    COALESCE(u.email, 'local')::TEXT AS user_email,
    p.username::TEXT AS user_username,
    COALESCE(p.is_admin, FALSE) AS user_is_admin,
    c.title,
    c.mode,
    c.status,
    c.source,
    c.source_url,
    c.start_date,
    c.roadmap_id,
    c.created_at,
    (SELECT COUNT(*) FROM public.topics t WHERE t.course_id = c.id) AS topic_count,
    (SELECT COUNT(*) FROM public.topics t WHERE t.course_id = c.id AND t.status = 'completed') AS completed_topic_count
  FROM public.courses c
  LEFT JOIN auth.users u ON u.id::text = c.user_id::text
  LEFT JOIN public.profiles p ON p.id::text = c.user_id::text
  ORDER BY c.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_all_courses() TO authenticated, service_role;

-- 5. RPC: admin_save_roadmap_template
-- Allows admins to create or update a default course (including full JSON edit)
CREATE OR REPLACE FUNCTION public.admin_save_roadmap_template(p_template JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_id TEXT;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorised: admin access required.');
  END IF;

  v_id := p_template->>'id';
  IF v_id IS NULL OR TRIM(v_id) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Template ID is required.');
  END IF;

  INSERT INTO public.roadmap_templates (
    id, name, category, icon, badge, description, roadmap_url, nodes, edges, is_active, created_by, updated_at
  ) VALUES (
    v_id,
    COALESCE(p_template->>'name', 'Untitled Default Course'),
    COALESCE(p_template->>'category', 'development'),
    COALESCE(p_template->>'icon', 'Route'),
    COALESCE(p_template->>'badge', 'Curriculum'),
    COALESCE(p_template->>'description', ''),
    COALESCE(p_template->>'roadmapUrl', p_template->>'roadmap_url', ''),
    COALESCE(p_template->'nodes', '[]'::jsonb),
    COALESCE(p_template->'edges', '[]'::jsonb),
    COALESCE((p_template->>'is_active')::boolean, TRUE),
    auth.uid(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name        = EXCLUDED.name,
    category    = EXCLUDED.category,
    icon        = EXCLUDED.icon,
    badge       = EXCLUDED.badge,
    description = EXCLUDED.description,
    roadmap_url = EXCLUDED.roadmap_url,
    nodes       = EXCLUDED.nodes,
    edges       = EXCLUDED.edges,
    is_active   = EXCLUDED.is_active,
    updated_at  = NOW();

  RETURN jsonb_build_object('success', true, 'id', v_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_save_roadmap_template(JSONB) TO authenticated, service_role;

-- 6. RPC: admin_delete_roadmap_template
CREATE OR REPLACE FUNCTION public.admin_delete_roadmap_template(p_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorised: admin access required.');
  END IF;

  -- Upsert with is_active = FALSE so that both custom and built-in templates
  -- are marked deleted system-wide.
  INSERT INTO public.roadmap_templates (id, name, is_active, updated_at)
  VALUES (p_id, 'Deleted Template', FALSE, NOW())
  ON CONFLICT (id) DO UPDATE SET
    is_active = FALSE,
    updated_at = NOW();

  RETURN jsonb_build_object('success', true, 'id', p_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_roadmap_template(TEXT) TO authenticated, service_role;

-- 7. RPC: admin_save_user_course_json
-- Allows admins to edit raw JSON of any user course & replace/update its topics
CREATE OR REPLACE FUNCTION public.admin_save_user_course_json(
  p_course_id   UUID,
  p_course_data JSONB,
  p_topics_data JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  elem JSONB;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorised: admin access required.');
  END IF;

  -- Update course metadata
  UPDATE public.courses
  SET
    title      = COALESCE(p_course_data->>'title', title),
    status     = COALESCE(p_course_data->>'status', status),
    mode       = COALESCE(p_course_data->>'mode', mode),
    source_url = p_course_data->>'source_url',
    start_date = CASE WHEN (p_course_data->>'start_date') IS NOT NULL AND (p_course_data->>'start_date') != ''
                      THEN (p_course_data->>'start_date')::date
                      ELSE start_date END
  WHERE id = p_course_id;

  -- If topics array is provided, upsert topics
  IF p_topics_data IS NOT NULL AND jsonb_typeof(p_topics_data) = 'array' THEN
    -- Delete existing topics for clean replace if specified, or upsert
    FOR elem IN SELECT * FROM jsonb_array_elements(p_topics_data)
    LOOP
      IF elem->>'id' IS NOT NULL THEN
        INSERT INTO public.topics (
          id, course_id, title, phase, status, position_x, position_y, parent_topic_id
        ) VALUES (
          elem->>'id',
          p_course_id,
          COALESCE(elem->>'title', elem->>'label', 'Topic'),
          elem->>'phase',
          COALESCE(elem->>'status', 'not_started'),
          (elem->>'position_x')::float,
          (elem->>'position_y')::float,
          elem->>'parent_topic_id'
        )
        ON CONFLICT (id) DO UPDATE SET
          title           = EXCLUDED.title,
          phase           = EXCLUDED.phase,
          status          = EXCLUDED.status,
          position_x      = EXCLUDED.position_x,
          position_y      = EXCLUDED.position_y,
          parent_topic_id = EXCLUDED.parent_topic_id;
      END IF;
    END LOOP;
  END IF;

  RETURN jsonb_build_object('success', true, 'course_id', p_course_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_save_user_course_json(UUID, JSONB, JSONB) TO authenticated, service_role;

-- 8. RPC: admin_delete_user_course
CREATE OR REPLACE FUNCTION public.admin_delete_user_course(p_course_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorised: admin access required.');
  END IF;

  DELETE FROM public.courses WHERE id = p_course_id;
  RETURN jsonb_build_object('success', true, 'course_id', p_course_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_user_course(UUID) TO authenticated, service_role;

-- 9. Add roadmap_templates to Realtime publication
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'roadmap_templates'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.roadmap_templates;
    END IF;
  END IF;
END $$;
