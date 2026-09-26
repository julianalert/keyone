-- ============================================================
-- Migration 008: Reporting aggregates
-- Run in the Supabase SQL Editor after 007.
-- Grouped in SQL so reports stay one round trip as the log grows.
-- ============================================================

-- Client breakdown by project × tool × model for a date range
create or replace function public.report_client_breakdown(p_client_id uuid, p_from timestamptz, p_to timestamptz)
returns table (
  project_id uuid, project_name text,
  catalog_slug text, catalog_name text,
  model text,
  calls bigint, blocked bigint, failed bigint,
  input_tokens bigint, output_tokens bigint,
  provider_cost_usd numeric, price_usd numeric
)
language sql stable security definer set search_path = public as $$
  select
    c.project_id, p.name,
    a.slug, a.name,
    c.model,
    count(*) filter (where c.status = 'completed'),
    count(*) filter (where c.status = 'blocked'),
    count(*) filter (where c.status = 'failed'),
    coalesce(sum(c.input_tokens), 0), coalesce(sum(c.output_tokens), 0),
    coalesce(sum(c.provider_cost_usd), 0), coalesce(sum(c.cost_usd), 0)
  from public.api_calls c
  join public.projects p on p.id = c.project_id
  join public.catalog_apis a on a.id = c.catalog_api_id
  where c.client_id = p_client_id and c.created_at >= p_from and c.created_at < p_to
  group by c.project_id, p.name, a.slug, a.name, c.model
$$;

-- Agency breakdown by client × project for a date range
create or replace function public.report_agency_breakdown(p_agency_id uuid, p_from timestamptz, p_to timestamptz)
returns table (
  client_id uuid, client_name text, rebill_markup_pct numeric,
  project_id uuid, project_name text,
  calls bigint, blocked bigint,
  provider_cost_usd numeric, price_usd numeric
)
language sql stable security definer set search_path = public as $$
  select
    c.client_id, cl.name, cl.rebill_markup_pct,
    c.project_id, p.name,
    count(*) filter (where c.status = 'completed'),
    count(*) filter (where c.status = 'blocked'),
    coalesce(sum(c.provider_cost_usd), 0), coalesce(sum(c.cost_usd), 0)
  from public.api_calls c
  join public.clients cl on cl.id = c.client_id
  join public.projects p on p.id = c.project_id
  where c.agency_id = p_agency_id and c.created_at >= p_from and c.created_at < p_to
  group by c.client_id, cl.name, cl.rebill_markup_pct, c.project_id, p.name
$$;

-- Daily series for a client or project
create or replace function public.report_daily(p_scope text, p_id uuid, p_from timestamptz, p_to timestamptz)
returns table (day date, calls bigint, price_usd numeric)
language sql stable security definer set search_path = public as $$
  select
    (c.created_at at time zone 'utc')::date,
    count(*) filter (where c.status = 'completed'),
    coalesce(sum(c.cost_usd), 0)
  from public.api_calls c
  where c.created_at >= p_from and c.created_at < p_to
    and ((p_scope = 'client' and c.client_id = p_id) or (p_scope = 'project' and c.project_id = p_id))
  group by 1
  order by 1
$$;
