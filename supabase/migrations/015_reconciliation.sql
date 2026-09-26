-- ============================================================
-- Migration 015: Provider cost reconciliation
-- Run in the Supabase SQL Editor after 014.
-- One row per provider × day × model: what key.one estimated vs what
-- the provider actually billed. Platform-only; no agency can read it.
-- ============================================================

create table if not exists public.reconciliation_days (
  id uuid primary key default gen_random_uuid(),
  provider text not null,                      -- 'openai' | 'anthropic'
  day date not null,
  model text not null default '*',             -- normalized model id, '*' = provider total
  our_calls int default 0 not null,
  our_input_tokens bigint default 0 not null,
  our_output_tokens bigint default 0 not null,
  our_provider_cost_usd numeric(12,6) default 0 not null,   -- what we estimated we'd pay
  our_price_usd numeric(12,6) default 0 not null,           -- what we charged projects
  actual_cost_usd numeric(12,6),                            -- what the provider billed (null = not fetched)
  actual_input_tokens bigint,
  actual_output_tokens bigint,
  variance_usd numeric(12,6),                               -- actual - ours (positive = we under-estimated)
  variance_pct numeric(8,2),
  fetched_at timestamptz,
  note text,
  unique (provider, day, model)
);
create index if not exists idx_reconciliation_provider_day on public.reconciliation_days(provider, day desc);

alter table public.reconciliation_days enable row level security;
-- No policies on purpose: only the service role (platform code) can read or write.

-- Our side of the ledger for a day range, grouped by provider × model × day
create or replace function public.reconcile_our_side(p_from date, p_to date)
returns table (provider text, day date, model text, calls bigint, input_tokens bigint, output_tokens bigint, provider_cost_usd numeric, price_usd numeric)
language sql stable security definer set search_path = public as $$
  select
    a.provider,
    (c.created_at at time zone 'utc')::date as day,
    coalesce(regexp_replace(c.model, '-\d{8}$|-\d{4}-\d{2}-\d{2}$', ''), '(none)') as model,
    count(*),
    coalesce(sum(c.input_tokens), 0) + coalesce(sum(c.cached_input_tokens), 0),
    coalesce(sum(c.output_tokens), 0),
    coalesce(sum(c.provider_cost_usd), 0),
    coalesce(sum(c.cost_usd), 0)
  from public.api_calls c
  join public.catalog_apis a on a.id = c.catalog_api_id
  where c.status = 'completed'
    and a.pricing_model = 'per_token'
    and (c.created_at at time zone 'utc')::date >= p_from
    and (c.created_at at time zone 'utc')::date <= p_to
  group by 1, 2, 3
$$;
