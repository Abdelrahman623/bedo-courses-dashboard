-- ============================================================
-- Migration: Hierarchical Note Folders & Nested Folders
-- Idempotent: safe to run once or re-run any time.
-- ============================================================

-- 1. Create note_folders table for nested folders
CREATE TABLE IF NOT EXISTS public.note_folders (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  parent_id  UUID REFERENCES public.note_folders(id) ON DELETE CASCADE,
  color      TEXT,
  position   INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS note_folders_user_idx ON public.note_folders(user_id);
CREATE INDEX IF NOT EXISTS note_folders_parent_idx ON public.note_folders(parent_id);

-- 2. Add folder_id to public.notes referencing note_folders
ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.note_folders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS notes_folder_id_idx ON public.notes(folder_id);

-- 3. Row Level Security on note_folders
ALTER TABLE public.note_folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS note_folders_owner ON public.note_folders;
CREATE POLICY note_folders_owner ON public.note_folders
  FOR ALL TO authenticated
  USING (user_id::text = auth.uid()::text OR public.is_admin())
  WITH CHECK (user_id::text = auth.uid()::text);

-- 4. Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.note_folders TO authenticated, service_role;
