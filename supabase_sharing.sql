-- ============================================================
-- Project Sharing, Milestones & Live Presence
-- Run this in your Supabase SQL editor.
-- Idempotent: safe to run once or re-run any time.
-- ============================================================

-- ─── profiles: allow cross-user reads ───────────────────────────────────────
-- Any authenticated user can read any profile (needed for search + invite join).
drop policy if exists "profiles_read_for_sharing" on public.profiles;
create policy "profiles_read_for_sharing" on public.profiles
  for select to authenticated
  using (true);

-- ─── project_invites ────────────────────────────────────────────────────────
create table if not exists public.project_invites (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  inviter_id  uuid not null references public.profiles(id) on delete cascade,
  invitee_id  uuid not null references public.profiles(id) on delete cascade,
  status      text not null default 'pending'
              check (status in ('pending','accepted','declined')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (project_id, invitee_id)
);

-- Fix FKs if they pointed to auth.users instead of public.profiles
alter table public.project_invites
  drop constraint if exists project_invites_inviter_id_fkey,
  drop constraint if exists project_invites_invitee_id_fkey;

alter table public.project_invites
  add constraint project_invites_inviter_id_fkey
    foreign key (inviter_id) references public.profiles(id) on delete cascade,
  add constraint project_invites_invitee_id_fkey
    foreign key (invitee_id) references public.profiles(id) on delete cascade;

alter table public.project_invites enable row level security;

-- Only the project owner (= the one who sent the invite) can manage invites.
-- IMPORTANT: Do NOT query public.projects here — that causes infinite recursion:
-- projects_shared_read → project_invites → invite_owner_all → projects → loop!
-- Using inviter_id = auth.uid() is equivalent (owner always sets themselves as inviter)
-- and breaks the cycle completely.
drop policy if exists "invite_owner_all" on public.project_invites;
create policy "invite_owner_all" on public.project_invites
  for all to authenticated
  using  (inviter_id = auth.uid())
  with check (inviter_id = auth.uid());

-- Invitee can read their own invites
drop policy if exists "invite_invitee_select" on public.project_invites;
create policy "invite_invitee_select" on public.project_invites
  for select to authenticated
  using (invitee_id = auth.uid());

-- Invitee can update status on their own invite only
drop policy if exists "invite_invitee_update" on public.project_invites;
create policy "invite_invitee_update" on public.project_invites
  for update to authenticated
  using (invitee_id = auth.uid())
  with check (status in ('accepted', 'declined'));

-- Invitee can delete their own invite to withdraw / leave a project
drop policy if exists "invite_invitee_delete" on public.project_invites;
create policy "invite_invitee_delete" on public.project_invites
  for delete to authenticated
  using (invitee_id = auth.uid());


-- Realtime for invites
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'project_invites'
  ) then
    alter publication supabase_realtime add table public.project_invites;
  end if;
end $$;

-- ─── projects: owner can always read their own projects ─────────────────────
-- This is a separate SELECT-only policy so it never conflicts with the FOR ALL
-- projects_owner policy from supabase_setup.sql, and has zero dependency on
-- public.is_admin() which could cause silent failures.
drop policy if exists "projects_owner_read" on public.projects;
create policy "projects_owner_read" on public.projects
  for select to authenticated
  using (user_id::text = auth.uid()::text);

-- ─── projects: collaborators can read shared projects ────────────────────────
drop policy if exists "projects_shared_read" on public.projects;
create policy "projects_shared_read" on public.projects
  for select to authenticated
  using (
    exists (
      select 1 from public.project_invites pi
      where pi.project_id = projects.id
        and pi.invitee_id = auth.uid()
        and pi.status = 'accepted'
    )
  );


-- ─── project_milestones ─────────────────────────────────────────────────────
create table if not exists public.project_milestones (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  title       text not null,
  definition  text,
  position    int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.project_milestones enable row level security;

-- Owner or accepted collaborator can SELECT milestones
drop policy if exists "milestone_read" on public.project_milestones;
create policy "milestone_read" on public.project_milestones
  for select to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_milestones.project_id
        and p.user_id::text = auth.uid()::text
    )
    or exists (
      select 1 from public.project_invites pi
      where pi.project_id = project_milestones.project_id
        and pi.invitee_id = auth.uid()
        and pi.status = 'accepted'
    )
  );

-- Only the project owner can INSERT / UPDATE / DELETE milestones
drop policy if exists "milestone_owner_write" on public.project_milestones;
create policy "milestone_owner_write" on public.project_milestones
  for all to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_milestones.project_id
        and p.user_id::text = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_milestones.project_id
        and p.user_id::text = auth.uid()::text
    )
  );

-- ─── milestone_items ────────────────────────────────────────────────────────
create table if not exists public.milestone_items (
  id           uuid primary key default gen_random_uuid(),
  milestone_id uuid not null references public.project_milestones(id) on delete cascade,
  text         text not null,
  done         boolean not null default false,
  position     int  not null default 0,
  created_at   timestamptz not null default now()
);

alter table public.milestone_items enable row level security;

-- Owner or accepted collaborator can SELECT items
drop policy if exists "item_read" on public.milestone_items;
create policy "item_read" on public.milestone_items
  for select to authenticated
  using (
    exists (
      select 1 from public.project_milestones pm
        join public.projects p on p.id = pm.project_id
      where pm.id = milestone_items.milestone_id
        and (
          p.user_id::text = auth.uid()::text
          or exists (
            select 1 from public.project_invites pi
            where pi.project_id = p.id
              and pi.invitee_id = auth.uid()
              and pi.status = 'accepted'
          )
        )
    )
  );

-- Only the project owner can INSERT / DELETE items
drop policy if exists "item_owner_write" on public.milestone_items;
create policy "item_owner_write" on public.milestone_items
  for all to authenticated
  using (
    exists (
      select 1 from public.project_milestones pm
        join public.projects p on p.id = pm.project_id
      where pm.id = milestone_items.milestone_id
        and p.user_id::text = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1 from public.project_milestones pm
        join public.projects p on p.id = pm.project_id
      where pm.id = milestone_items.milestone_id
        and p.user_id::text = auth.uid()::text
    )
  );

-- Owner AND collaborators can toggle `done`
drop policy if exists "item_collaborator_toggle" on public.milestone_items;
create policy "item_collaborator_toggle" on public.milestone_items
  for update to authenticated
  using (
    exists (
      select 1 from public.project_milestones pm
        join public.projects p on p.id = pm.project_id
      where pm.id = milestone_items.milestone_id
        and (
          p.user_id::text = auth.uid()::text
          or exists (
            select 1 from public.project_invites pi
            where pi.project_id = p.id
              and pi.invitee_id = auth.uid()
              and pi.status = 'accepted'
          )
        )
    )
  )
  with check (true);

-- Realtime for milestones and items
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'project_milestones'
  ) then
    alter publication supabase_realtime add table public.project_milestones;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'milestone_items'
  ) then
    alter publication supabase_realtime add table public.milestone_items;
  end if;
end $$;

-- ─── Table Grants (Crucial for authenticated role) ───────────────────────────
grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on table public.projects to authenticated, service_role;
grant select, insert, update, delete on table public.project_milestones to authenticated, service_role;
grant select, insert, update, delete on table public.milestone_items to authenticated, service_role;
grant select, insert, update, delete on table public.project_invites to authenticated, service_role;

-- ─── Helper: safely claim local projects for the authenticated user ─────────
create or replace function public.claim_local_projects()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null then
    update public.projects
    set user_id = auth.uid()::text
    where user_id = 'local';
  end if;
end;
$$;

grant execute on function public.claim_local_projects() to authenticated;

