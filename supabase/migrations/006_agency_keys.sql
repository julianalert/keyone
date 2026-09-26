-- ============================================================
-- Migration 006: Agency keys (management access for agents)
-- Run in the Supabase SQL Editor after 005.
--
-- A project key can only spend. An agency key can manage: create
-- clients and projects, mint project keys, read spend. Used by the
-- MCP server and the skill so an agent can set up a project from chat.
-- ============================================================

create table if not exists public.agency_keys (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  name text not null default 'default',
  key_hash text not null unique,      -- sha256 hex
  key_prefix text not null,           -- kone_admin_xxx
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz default now() not null
);

create index if not exists idx_agency_keys_agency on public.agency_keys(agency_id);

alter table public.agency_keys enable row level security;
create policy "agency_keys_member" on public.agency_keys
  for all using (agency_id in (select public.my_agency_ids()));

revoke select (key_hash) on public.agency_keys from authenticated, anon;
