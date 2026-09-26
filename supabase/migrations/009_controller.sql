-- ============================================================
-- Migration 009: Controller agent
-- Run in the Supabase SQL Editor after 008.
-- ============================================================

-- Allowed models per project (null = any). Enforced by the proxy; the
-- controller proposes it when an expensive model does cheap work.
alter table public.projects
  add column if not exists allowed_models text[];

-- Autonomy is reserved; v1 only proposes.
alter table public.agencies
  add column if not exists controller_autonomy text default 'propose' not null,   -- 'propose' | 'apply_safe'
  add column if not exists controller_enabled boolean default true not null;

create table if not exists public.controller_runs (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  trigger text not null,                 -- 'manual' | 'mcp' | 'cron'
  status text not null default 'running', -- 'running' | 'completed' | 'failed'
  window_from timestamptz not null,
  window_to timestamptz not null,
  findings_count int default 0 not null,
  digest text,                           -- plain-language summary
  model text,                            -- model used to write the digest, null = deterministic
  llm_cost_usd numeric(10,6) default 0 not null,
  error text,
  created_at timestamptz default now() not null,
  completed_at timestamptz
);
create index if not exists idx_controller_runs_agency on public.controller_runs(agency_id, created_at desc);

create table if not exists public.controller_findings (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.controller_runs(id) on delete cascade,
  agency_id uuid not null references public.agencies(id) on delete cascade,
  severity text not null,                -- 'high' | 'medium' | 'low'
  kind text not null,                    -- 'burn_rate' | 'drift' | 'model_efficiency' | 'idle_budget' | 'blocked_pattern' | 'waste' | 'pricing_gap' | 'rebill' | 'stale_request'
  scope text not null,                   -- 'project' | 'client' | 'key' | 'agency'
  scope_id uuid,
  scope_label text not null,
  title text not null,
  detail text not null,
  metrics jsonb,
  action jsonb,                          -- { type, params, expected_effect } or null
  status text not null default 'proposed',   -- 'proposed' | 'applied' | 'dismissed'
  decided_at timestamptz,
  decided_by text,
  created_at timestamptz default now() not null
);
create index if not exists idx_controller_findings_agency on public.controller_findings(agency_id, status, created_at desc);
create index if not exists idx_controller_findings_run on public.controller_findings(run_id);

alter table public.controller_runs enable row level security;
alter table public.controller_findings enable row level security;
create policy "controller_runs_member" on public.controller_runs
  for all using (agency_id in (select public.my_agency_ids()));
create policy "controller_findings_member" on public.controller_findings
  for all using (agency_id in (select public.my_agency_ids()));

-- ------------------------------------------------------------
-- One query for everything the analysis needs: per project × model,
-- for the last 35 days, bucketed by day.
-- ------------------------------------------------------------
create or replace function public.controller_facts(p_agency_id uuid, p_from timestamptz)
returns table (
  day date, client_id uuid, project_id uuid, project_key_id uuid, catalog_slug text, model text,
  calls bigint, blocked bigint, failed bigint,
  input_tokens bigint, output_tokens bigint,
  provider_cost_usd numeric, price_usd numeric,
  fallback_priced bigint
)
language sql stable security definer set search_path = public as $$
  select
    (c.created_at at time zone 'utc')::date,
    c.client_id, c.project_id, c.project_key_id, a.slug, c.model,
    count(*) filter (where c.status = 'completed'),
    count(*) filter (where c.status = 'blocked'),
    count(*) filter (where c.status = 'failed'),
    coalesce(sum(c.input_tokens), 0), coalesce(sum(c.output_tokens), 0),
    coalesce(sum(c.provider_cost_usd), 0), coalesce(sum(c.cost_usd), 0),
    count(*) filter (where c.pricing_status = 'fallback')
  from public.api_calls c
  join public.catalog_apis a on a.id = c.catalog_api_id
  where c.agency_id = p_agency_id and c.created_at >= p_from
  group by 1, 2, 3, 4, 5, 6
$$;
