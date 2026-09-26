-- ============================================================
-- Migration 007: Alerts, spike auto-freeze, budget requests
-- Run in the Supabase SQL Editor after 006.
-- ============================================================

-- Agency notification + control settings
alter table public.agencies
  add column if not exists alert_email text,                                  -- null = owner's email
  add column if not exists webhook_url text,
  add column if not exists spike_multiplier numeric(6,2) default 10 not null,  -- last hour vs hourly baseline
  add column if not exists spike_floor_usd numeric(10,2) default 10 not null,  -- and at least this much in the hour
  add column if not exists auto_approve_increase_usd numeric(10,2) default 0 not null;

-- Keys can be frozen independently of the project
alter table public.project_keys
  add column if not exists frozen_at timestamptz,
  add column if not exists frozen_reason text;

create index if not exists idx_api_calls_key_created on public.api_calls(project_key_id, created_at desc);

-- Alerts: one row per event; the unique key dedupes threshold alerts per period
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  kind text not null,             -- 'budget_threshold' | 'key_frozen' | 'budget_request' | 'budget_decided'
  scope text not null,            -- 'project' | 'client' | 'key' | 'request'
  scope_id uuid not null,
  dedupe_key text,                -- e.g. project:<id>:80:2026-09
  title text not null,
  body text,
  data jsonb,
  delivered_email boolean default false not null,
  delivered_webhook boolean default false not null,
  read_at timestamptz,
  created_at timestamptz default now() not null,
  unique (agency_id, dedupe_key)
);
create index if not exists idx_alerts_agency_created on public.alerts(agency_id, created_at desc);

-- Budget increase requests, filed by an agent (project key) or a user
create table if not exists public.budget_requests (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  project_key_id uuid references public.project_keys(id) on delete set null,
  requested_by text not null default 'agent',     -- 'agent' | 'user'
  current_budget_usd numeric(10,2),
  requested_budget_usd numeric(10,2) not null,
  reason text,
  status text not null default 'pending',         -- 'pending' | 'approved' | 'denied'
  auto_approved boolean default false not null,
  decision_token text not null,                   -- single-use, for email links
  decided_at timestamptz,
  decided_by text,                                -- 'auto' | 'email' | 'dashboard' | 'mcp'
  created_at timestamptz default now() not null
);
create index if not exists idx_budget_requests_agency on public.budget_requests(agency_id, status, created_at desc);
create index if not exists idx_budget_requests_project on public.budget_requests(project_id, created_at desc);

alter table public.alerts enable row level security;
alter table public.budget_requests enable row level security;
create policy "alerts_member" on public.alerts
  for all using (agency_id in (select public.my_agency_ids()));
create policy "budget_requests_member" on public.budget_requests
  for all using (agency_id in (select public.my_agency_ids()));
revoke select (decision_token) on public.budget_requests from authenticated, anon;

-- ------------------------------------------------------------
-- Spend windows for a key: last hour vs the previous 7 days
-- ------------------------------------------------------------
create or replace function public.key_spend_window(p_key_id uuid)
returns table (last_hour numeric, prev_week numeric, history_hours numeric)
language sql stable security definer set search_path = public as $$
  select
    coalesce(sum(c.cost_usd) filter (where c.created_at >= now() - interval '1 hour'), 0),
    coalesce(sum(c.cost_usd) filter (where c.created_at <  now() - interval '1 hour'
                                       and c.created_at >= now() - interval '7 days'), 0),
    least(168, greatest(0, extract(epoch from (now() - interval '1 hour' - k.created_at)) / 3600.0))
  from public.project_keys k
  left join public.api_calls c on c.project_key_id = k.id and c.created_at >= now() - interval '7 days'
  where k.id = p_key_id
  group by k.created_at
$$;
