-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

-- Users (mirrors Supabase auth.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  stripe_customer_id text,
  created_at timestamptz default now() not null
);

-- Wallets (one per user)
create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  balance_usd numeric(10,6) default 0 not null,
  updated_at timestamptz default now() not null,
  unique (user_id)
);

-- Agents
create table public.agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  api_key_hash text not null unique,  -- bcrypt hash
  api_key_prefix text not null,       -- first 8 chars for display (e.g. kone_liv)
  monthly_budget_usd numeric(10,2),
  is_active boolean default true not null,
  created_at timestamptz default now() not null
);

-- Catalog APIs
create table public.catalog_apis (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null,             -- 'ai' | 'social' | 'seo' | 'geo' | 'search'
  description text,
  base_url text not null,
  provider text not null,             -- 'openai' | 'anthropic' | 'perplexity' | 'apify' | 'dataforseo'
  pricing_model text not null,        -- 'per_call' | 'per_result' | 'per_token'
  cost_per_call numeric(10,6),        -- what we pay
  price_per_call numeric(10,6),       -- what user pays
  price_per_result numeric(10,6),
  auth_config jsonb,
  icon text,
  is_active boolean default true not null
);

-- API Calls log
create table public.api_calls (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  catalog_api_id uuid not null references public.catalog_apis(id),
  endpoint text not null,
  request_payload jsonb,
  response_status int,
  cost_usd numeric(10,6) default 0 not null,
  duration_ms int,
  input_tokens int,
  output_tokens int,
  model text,
  created_at timestamptz default now() not null
);

-- Wallet Transactions
create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,                 -- 'topup' | 'deduction'
  amount_usd numeric(10,6) not null,
  description text,
  stripe_payment_intent_id text,
  api_call_id uuid references public.api_calls(id),
  created_at timestamptz default now() not null
);

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_agents_user_id on public.agents(user_id);
create index idx_api_calls_agent_id on public.api_calls(agent_id);
create index idx_api_calls_user_id on public.api_calls(user_id);
create index idx_api_calls_created_at on public.api_calls(created_at desc);
create index idx_wallet_transactions_user_id on public.wallet_transactions(user_id);
create index idx_wallet_transactions_created_at on public.wallet_transactions(created_at desc);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.users enable row level security;
alter table public.wallets enable row level security;
alter table public.agents enable row level security;
alter table public.api_calls enable row level security;
alter table public.wallet_transactions enable row level security;
-- catalog_apis is public read
alter table public.catalog_apis enable row level security;

-- Users: own row only
create policy "users_own" on public.users
  for all using (auth.uid() = id);

-- Wallets: own wallet only
create policy "wallets_own" on public.wallets
  for all using (auth.uid() = user_id);

-- Agents: own agents only
create policy "agents_own" on public.agents
  for all using (auth.uid() = user_id);

-- API calls: own calls only
create policy "api_calls_own" on public.api_calls
  for all using (auth.uid() = user_id);

-- Wallet transactions: own transactions only
create policy "wallet_transactions_own" on public.wallet_transactions
  for all using (auth.uid() = user_id);

-- Catalog APIs: everyone can read active APIs
create policy "catalog_apis_read" on public.catalog_apis
  for select using (is_active = true);

-- ============================================================
-- TRIGGER: auto-create wallet + user row on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);

  insert into public.wallets (user_id, balance_usd)
  values (new.id, 0);

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- FUNCTION: atomic wallet deduction with row lock
-- ============================================================
create or replace function public.deduct_wallet(
  p_user_id uuid,
  p_amount numeric,
  p_description text,
  p_api_call_id uuid default null
)
returns numeric as $$
declare
  v_balance numeric;
begin
  -- Lock the wallet row to prevent race conditions
  select balance_usd into v_balance
  from public.wallets
  where user_id = p_user_id
  for update;

  if v_balance < p_amount then
    raise exception 'insufficient_balance' using detail = v_balance::text;
  end if;

  update public.wallets
  set balance_usd = balance_usd - p_amount,
      updated_at = now()
  where user_id = p_user_id;

  insert into public.wallet_transactions (user_id, type, amount_usd, description, api_call_id)
  values (p_user_id, 'deduction', p_amount, p_description, p_api_call_id);

  return v_balance - p_amount;
end;
$$ language plpgsql security definer;

-- ============================================================
-- FUNCTION: wallet top-up (called from Stripe webhook via service role)
-- ============================================================
create or replace function public.topup_wallet(
  p_user_id uuid,
  p_amount numeric,
  p_stripe_payment_intent_id text
)
returns numeric as $$
declare
  v_new_balance numeric;
begin
  update public.wallets
  set balance_usd = balance_usd + p_amount,
      updated_at = now()
  where user_id = p_user_id
  returning balance_usd into v_new_balance;

  insert into public.wallet_transactions (user_id, type, amount_usd, description, stripe_payment_intent_id)
  values (p_user_id, 'topup', p_amount, 'Stripe top-up', p_stripe_payment_intent_id);

  return v_new_balance;
end;
$$ language plpgsql security definer;

-- ============================================================
-- SEED: V1 Catalog APIs
-- ============================================================
insert into public.catalog_apis
  (name, slug, category, description, base_url, provider, pricing_model, cost_per_call, price_per_call, icon)
values
  (
    'OpenAI',
    'openai',
    'ai',
    'GPT-4o and GPT-4o-mini via unified proxy. Drop-in replacement for the OpenAI API.',
    'https://api.openai.com/v1/chat/completions',
    'openai',
    'per_token',
    null, null,
    '🤖'
  ),
  (
    'Anthropic',
    'anthropic',
    'ai',
    'Claude Sonnet and Haiku models for your agents.',
    'https://api.anthropic.com/v1/messages',
    'anthropic',
    'per_token',
    null, null,
    '🧠'
  ),
  (
    'Perplexity',
    'perplexity',
    'search',
    'AI-powered search with live web data. Sonar and Sonar Pro models.',
    'https://api.perplexity.ai/chat/completions',
    'perplexity',
    'per_call',
    0.005000, 0.007000,
    '🔍'
  ),
  (
    'Google Maps (Apify)',
    'apify-google-maps',
    'geo',
    'Local business data from Google Maps. Extract names, addresses, reviews, and more.',
    'https://api.apify.com/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items',
    'apify',
    'per_result',
    null, null,
    '📍'
  ),
  (
    'DataForSEO',
    'dataforseo',
    'seo',
    'Keywords, SERP data, and search volume for SEO automation.',
    'https://api.dataforseo.com/v3/serp/google/organic/live/advanced',
    'dataforseo',
    'per_result',
    null, null,
    '📊'
  );
