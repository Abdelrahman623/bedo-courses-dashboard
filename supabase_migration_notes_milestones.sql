-- ============================================================
-- Migration: Link Notes to Project Milestones
-- Idempotent: safe to run once or re-run any time.
-- ============================================================

-- 1. Add milestone_id column to public.notes referencing project_milestones
ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS milestone_id UUID REFERENCES public.project_milestones(id) ON DELETE SET NULL;

-- 2. Index for fast queries by milestone_id
CREATE INDEX IF NOT EXISTS notes_milestone_id_idx ON public.notes(milestone_id);
