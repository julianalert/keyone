-- ============================================================
-- Migration 005: Model pricing table + provider bookkeeping
-- Run in the Supabase SQL Editor after 004.
-- ============================================================

-- Wholesale prices per 1M tokens. The user price = wholesale × (1 + margin),
-- margin from KEYONE_MARGIN_PCT (default 30). Edit rows here as providers
-- change prices; the proxy re-reads the table every minute.
create table if not exists public.model_prices (
  id uuid primary key default gen_random_uuid(),
  provider text not null,                         -- matches catalog_apis.provider
  model text not null,                            -- exact id, or '*' for the provider fallback
  input_per_million numeric(10,4) not null,
  output_per_million numeric(10,4) not null,
  cached_input_per_million numeric(10,4),         -- null = same as input
  notes text,
  is_active boolean default true not null,
  updated_at timestamptz default now() not null,
  unique (provider, model)
);

alter table public.model_prices enable row level security;
create policy "model_prices_read" on public.model_prices
  for select using (is_active = true);

-- Call log: what we paid vs what we charged, and how the price was found
alter table public.api_calls
  add column if not exists provider_cost_usd numeric(10,6) default 0 not null,
  add column if not exists pricing_status text,        -- 'exact' | 'alias' | 'fallback' | 'unknown' | 'catalog'
  add column if not exists cached_input_tokens int,
  add column if not exists is_stream boolean default false not null;

-- Per-result prices move onto the catalog row (user price)
update public.catalog_apis set price_per_result = 0.002  where slug = 'apify-google-maps';
update public.catalog_apis set price_per_result = 0.0015 where slug = 'dataforseo';

-- ------------------------------------------------------------
-- Seed: wholesale list prices, standard tier, short context.
-- Sources: developers.openai.com/api/docs/pricing and the
-- Anthropic model table, both read 2026-09-26.
-- ------------------------------------------------------------
insert into public.model_prices (provider, model, input_per_million, output_per_million, cached_input_per_million, notes) values
  -- OpenAI flagship
  ('openai', 'gpt-6-astra',      10.00, 50.00,  1.00,  null),
  ('openai', 'gpt-6-sol',         2.00, 10.00,  0.20,  null),
  ('openai', 'gpt-6-luna',        0.10,  0.50,  0.01,  null),
  ('openai', 'gpt-5.6-sol',       4.00, 20.00,  0.40,  'promotional pricing through 2026-11-21'),
  ('openai', 'gpt-5.6-terra',     2.00, 12.00,  0.20,  null),
  ('openai', 'gpt-5.6-luna',      0.20,  1.20,  0.02,  null),
  ('openai', 'gpt-5.6-cyber',    12.50, 75.00,  1.25,  null),
  ('openai', 'gpt-5.5',           5.00, 30.00,  0.50,  null),
  ('openai', 'gpt-5.5-pro',      30.00,180.00,  null,  null),
  ('openai', 'gpt-5.4',           2.50, 15.00,  0.25,  null),
  ('openai', 'gpt-5.4-pro',      30.00,180.00,  null,  null),
  ('openai', 'gpt-5.4-mini',      0.75,  4.50,  0.075, null),
  ('openai', 'gpt-5.4-nano',      0.20,  1.25,  0.02,  null),
  ('openai', 'gpt-5.3-codex',     1.75, 14.00,  0.175, null),
  ('openai', 'gpt-5.2',           1.75, 14.00,  0.175, null),
  ('openai', 'gpt-5.2-pro',      21.00,168.00,  null,  null),
  ('openai', 'gpt-5.1',           1.25, 10.00,  0.125, null),
  ('openai', 'gpt-5',             1.25, 10.00,  0.125, null),
  ('openai', 'gpt-5-mini',        0.25,  2.00,  0.025, null),
  ('openai', 'gpt-5-nano',        0.05,  0.40,  0.005, null),
  ('openai', 'gpt-5-pro',        15.00,120.00,  null,  null),
  ('openai', 'chat-latest',       5.00, 30.00,  0.50,  null),
  ('openai', 'gpt-4.1',           2.00,  8.00,  0.50,  null),
  ('openai', 'gpt-4.1-mini',      0.40,  1.60,  0.10,  null),
  ('openai', 'gpt-4.1-nano',      0.10,  0.40,  0.025, null),
  ('openai', 'gpt-4o',            2.50, 10.00,  1.25,  null),
  ('openai', 'gpt-4o-mini',       0.15,  0.60,  0.075, null),
  ('openai', 'o4-mini',           1.10,  4.40,  0.275, null),
  ('openai', 'o3',                2.00,  8.00,  0.50,  null),
  ('openai', 'o3-mini',           1.10,  4.40,  0.55,  null),
  ('openai', 'o3-pro',           20.00, 80.00,  null,  null),
  ('openai', 'o1',               15.00, 60.00,  7.50,  null),
  ('openai', 'o1-pro',          150.00,600.00,  null,  null),
  ('openai', 'gpt-4-turbo',      10.00, 30.00,  null,  null),
  ('openai', 'gpt-4',            30.00, 60.00,  null,  null),
  ('openai', 'gpt-3.5-turbo',     0.50,  1.50,  null,  null),
  ('openai', '*',                10.00, 50.00,  null,  'fallback for unknown OpenAI models: charged at the top tier'),

  -- Anthropic
  ('anthropic', 'claude-fable-5-1',  10.00, 50.00, 0.25, null),
  ('anthropic', 'claude-fable-5',    10.00, 50.00, 1.00, null),
  ('anthropic', 'claude-opus-5-5',    4.00, 20.00, 0.20, null),
  ('anthropic', 'claude-opus-5',      5.00, 25.00, 0.50, null),
  ('anthropic', 'claude-opus-4-8',    5.00, 25.00, 0.50, null),
  ('anthropic', 'claude-opus-4-7',    5.00, 25.00, 0.50, null),
  ('anthropic', 'claude-opus-4-6',    5.00, 25.00, 0.50, null),
  ('anthropic', 'claude-opus-4-5',    5.00, 25.00, 0.50, null),
  ('anthropic', 'claude-opus-4-1',   15.00, 75.00, 1.50, 'deprecated'),
  ('anthropic', 'claude-opus-4-0',   15.00, 75.00, 1.50, 'deprecated'),
  ('anthropic', 'claude-sonnet-5',    2.00, 10.00, 0.20, null),
  ('anthropic', 'claude-sonnet-4-6',  3.00, 15.00, 0.30, null),
  ('anthropic', 'claude-sonnet-4-5',  3.00, 15.00, 0.30, null),
  ('anthropic', 'claude-sonnet-4-0',  3.00, 15.00, 0.30, 'deprecated'),
  ('anthropic', 'claude-haiku-4-5',   1.00,  5.00, 0.10, null),
  ('anthropic', '*',                 10.00, 50.00, null, 'fallback for unknown Anthropic models: charged at the top tier'),

  -- Perplexity (per-call in the catalog today; kept for token reporting)
  ('perplexity', 'sonar',      1.00,  1.00, null, null),
  ('perplexity', 'sonar-pro',  3.00, 15.00, null, null),
  ('perplexity', '*',          3.00, 15.00, null, 'fallback')
on conflict (provider, model) do update set
  input_per_million = excluded.input_per_million,
  output_per_million = excluded.output_per_million,
  cached_input_per_million = excluded.cached_input_per_million,
  notes = excluded.notes,
  updated_at = now();
