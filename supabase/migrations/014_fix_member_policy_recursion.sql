-- ============================================================
-- Migration 014: Fix recursive policy on agency_members
-- Run in the Supabase SQL Editor after 013.
--
-- 013's manage policy selected from agency_members inside a policy on
-- agency_members, which Postgres rejects as infinite recursion. That made
-- every membership lookup fail and the dashboard loop to /login.
-- ============================================================

create or replace function public.my_admin_agency_ids()
returns setof uuid
language sql stable security definer set search_path = public as $$
  select agency_id from public.agency_members
  where user_id = auth.uid() and role in ('owner', 'admin')
$$;

drop policy if exists "agency_members_manage" on public.agency_members;
create policy "agency_members_manage" on public.agency_members
  for all using (agency_id in (select public.my_admin_agency_ids()));

-- users_agency_mates also nested a select on agency_members; route it
-- through the security-definer helper as well.
drop policy if exists "users_agency_mates" on public.users;
create policy "users_agency_mates" on public.users
  for select using (
    id in (select m.user_id from public.agency_members m where m.agency_id in (select public.my_agency_ids()))
  );
