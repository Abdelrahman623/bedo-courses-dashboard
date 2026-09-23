-- =============================================================================
-- Bedo Courses Dashboard — Academic Mode migration (Tier 0)
-- Run this in Supabase SQL Editor AFTER supabase_setup.sql has been applied.
-- NOTE: This script is idempotent — safe to re-run.
--
-- What this adds:
--   1. `mode` + `source` columns on public.courses, so every course — seeded
--      or user-entered — can be tagged 'academic' (concurrent, timetabled
--      college-style courses) or 'courses' (sequential, self-directed
--      roadmaps, the original model). Both modes coexist per account.
--   2. Three new Academic-mode tables: schedule, assessments, grades.
--      All three resolve ownership through their course (like `topics`
--      already does) rather than carrying their own user_id.
-- Deliberately NOT included here (later tiers): mode-switcher UI, timetable/
-- exam-tracker/GPA views, GPA rollup UI. This migration is data-model only.
-- =============================================================================

-- ── 1. courses.mode / courses.source ────────────────────────────────────────
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'courses';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'user';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'courses_mode_check' AND conrelid = 'public.courses'::regclass
  ) THEN
    ALTER TABLE public.courses ADD CONSTRAINT courses_mode_check
      CHECK (mode IN ('academic', 'courses'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'courses_source_check' AND conrelid = 'public.courses'::regclass
  ) THEN
    ALTER TABLE public.courses ADD CONSTRAINT courses_source_check
      CHECK (source IN ('seeded', 'user'));
  END IF;
END$$;

-- Back-fill any pre-existing rows: a course enrolled from a built-in template
-- always has a roadmap_id (see roadmapStore.addTemplateAsCourse) and is
-- sequential by nature, so it's 'seeded' + 'courses' mode. Everything else
-- was typed in by the user directly.
UPDATE public.courses SET source = 'seeded' WHERE roadmap_id IS NOT NULL AND source = 'user';

CREATE INDEX IF NOT EXISTS courses_mode_idx ON public.courses (mode);

-- ── 2. schedule ──────────────────────────────────────────────────────────────
-- One recurring weekly class slot per row — a course can have several
-- (e.g. a lecture on Mon/Wed and a lab on Fri).
CREATE TABLE IF NOT EXISTS public.schedule (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id   UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  location    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS schedule_course_idx ON public.schedule (course_id);

-- ── 3. assessments ────────────────────────────────────────────────────────────
-- An exam/assignment/quiz belonging to a course. `weight` is a fraction of
-- the course grade (0–1, e.g. 0.25 = 25%) — the app does not enforce that a
-- course's weights sum to 1, since a plan is often entered incrementally.
CREATE TABLE IF NOT EXISTS public.assessments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id  UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('exam', 'assignment', 'quiz')),
  due_date   DATE NOT NULL,
  weight     NUMERIC NOT NULL DEFAULT 0 CHECK (weight >= 0 AND weight <= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS assessments_course_idx ON public.assessments (course_id);
CREATE INDEX IF NOT EXISTS assessments_due_date_idx ON public.assessments (due_date);

-- ── 4. grades ─────────────────────────────────────────────────────────────────
-- At most one grade per assessment (enforced by the UNIQUE constraint) — the
-- store's setGrade() upserts against this rather than inserting duplicates.
CREATE TABLE IF NOT EXISTS public.grades (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL UNIQUE REFERENCES public.assessments(id) ON DELETE CASCADE,
  score         NUMERIC NOT NULL,
  max_score     NUMERIC NOT NULL CHECK (max_score > 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS grades_assessment_idx ON public.grades (assessment_id);

-- ── 5. RLS ─────────────────────────────────────────────────────────────────────
-- Same pattern as `topics`: none of these three tables carry their own
-- user_id — ownership resolves through the course they belong to.
ALTER TABLE public.schedule    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades      ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS schedule_owner ON public.schedule;
CREATE POLICY schedule_owner ON public.schedule
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = schedule.course_id AND c.user_id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = schedule.course_id AND c.user_id::text = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS assessments_owner ON public.assessments;
CREATE POLICY assessments_owner ON public.assessments
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = assessments.course_id AND c.user_id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = assessments.course_id AND c.user_id::text = auth.uid()::text
    )
  );

-- grades resolves ownership through assessments -> courses (two hops).
DROP POLICY IF EXISTS grades_owner ON public.grades;
CREATE POLICY grades_owner ON public.grades
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.assessments a
      JOIN public.courses c ON c.id = a.course_id
      WHERE a.id = grades.assessment_id AND c.user_id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assessments a
      JOIN public.courses c ON c.id = a.course_id
      WHERE a.id = grades.assessment_id AND c.user_id::text = auth.uid()::text
    )
  );

-- ── 6. Account-deletion cleanup (mirrors the pattern in supabase_setup.sql's
-- delete-user function) ───────────────────────────────────────────────────────
-- If supabase_setup.sql's delete_user()/on-delete-profile trigger already
-- deletes public.courses for the target user, the ON DELETE CASCADE above
-- takes care of schedule/assessments/grades automatically — nothing further
-- to add here. This section is a no-op placeholder in case a future review
-- of that function wants an explicit reminder that these tables exist.
