-- ============================================================
-- Migration 004: Spend controls
-- Run in the Supabase SQL Editor after 003.
-- ============================================================

-- Per-project controls
alter table public.projects
  add column if not exists max_cost_per_call_usd numeric(10,6),   -- null = no cap
  add column if not exists allowed_apis text[];                    -- catalog slugs; null = all

-- Blocked calls are logged for reporting (status = 'blocked', cost 0)
alter table public.api_calls
  add column if not exists blocked_reason text;

create index if not exists idx_api_calls_project_status
  on public.api_calls(project_id, status, created_at desc);

-- ------------------------------------------------------------
-- Month-to-date spend for a project and its client in one call.
-- Used by the proxy before every request.
-- ------------------------------------------------------------
create or replace function public.spend_snapshot(p_project_id uuid, p_client_id uuid)
returns table (project_spent numeric, client_spent numeric)
language sql stable security definer set search_path = public as $$
  select
    coalesce(sum(cost_usd) filter (where project_id = p_project_id), 0) as project_spent,
    coalesce(sum(cost_usd), 0) as client_spent
  from public.api_calls
  where client_id = p_client_id
    and created_at >= date_trunc('month', now())
$$;
