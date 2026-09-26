-- ============================================================
-- Migration 003: Agencies, clients, projects, project keys
-- Run in the Supabase SQL Editor after 001 and 002.
--
-- Pre-launch migration: drops the agent-scoped tables and
-- recreates them under the agency > client > project model.
-- No data is carried over.
-- ============================================================

-- ------------------------------------------------------------
-- Drop old objects
-- ------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.deduct_wallet(uuid, numeric, text, uuid);
drop function if exists public.topup_wallet(uuid, numeric, text);

drop table if exists public.wallet_transactions;
drop table if exists public.api_calls;
drop table if exists public.wallets;
drop table if exists public.agents;

-- ------------------------------------------------------------
-- Agencies + membership
-- ------------------------------------------------------------
create table public.agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null references public.users(id) on delete cascade,
  stripe_customer_id text,
  created_at timestamptz default now() not null
);

create table public.agency_members (
  agency_id uuid not null references public.agencies(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'owner',          -- 'owner' | 'admin' | 'member'
  created_at timestamptz default now() not null,
  primary key (agency_id, user_id)
);

-- Wallet: one per agency
create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  balance_usd numeric(10,6) default 0 not null,
  updated_at timestamptz default now() not null,
  unique (agency_id)
);

-- ------------------------------------------------------------
-- Clients (cost centers) and projects
-- ------------------------------------------------------------
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  name text not null,
  rebill_markup_pct numeric(6,2) default 0 not null,   -- what you add when rebilling
  monthly_budget_usd numeric(10,2),                     -- enforced in step 2
  is_active boolean default true not null,
  created_at timestamptz default now() not null
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  agency_id uuid not null references public.agencies(id) on delete cascade,
  name text not null,
  monthly_budget_usd numeric(10,2),                     -- enforced in step 2
  is_active boolean default true not null,
  created_at timestamptz default now() not null
);

-- Project keys: the "virtual cards". One project may have several
-- (rotation), each revocable on its own.
create table public.project_keys (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  agency_id uuid not null references public.agencies(id) on delete cascade,
  name text not null default 'default',
  key_hash text not null unique,          -- sha256 hex of the full key
  key_prefix text not null,               -- first 12 chars for display
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz default now() not null
);

-- ------------------------------------------------------------
-- API call log (denormalized ids for fast roll-ups)
-- ------------------------------------------------------------
create table public.api_calls (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  project_key_id uuid references public.project_keys(id) on delete set null,
  catalog_api_id uuid not null references public.catalog_apis(id),
  endpoint text not null,
  request_payload jsonb,
  response_status int,
  cost_usd numeric(10,6) default 0 not null,
  duration_ms int,
  input_tokens int,
  output_tokens int,
  model text,
  status text not null default 'completed',   -- 'pending' | 'completed' | 'failed'
  external_run_id text,
  created_at timestamptz default now() not null
);

create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  type text not null,                 -- 'topup' | 'deduction'
  amount_usd numeric(10,6) not null,
  description text,
  stripe_payment_intent_id text,
  api_call_id uuid references public.api_calls(id),
  created_at timestamptz default now() not null
);

-- ------------------------------------------------------------
-- Indexes
-- ------------------------------------------------------------
create index idx_agency_members_user on public.agency_members(user_id);
create index idx_clients_agency on public.clients(agency_id);
create index idx_projects_client on public.projects(client_id);
create index idx_projects_agency on public.projects(agency_id);
create index idx_project_keys_project on public.project_keys(project_id);
create index idx_api_calls_agency_created on public.api_calls(agency_id, created_at desc);
create index idx_api_calls_client_created on public.api_calls(client_id, created_at desc);
create index idx_api_calls_project_created on public.api_calls(project_id, created_at desc);
create index idx_api_calls_external_run_id on public.api_calls(external_run_id) where external_run_id is not null;
create index idx_wallet_transactions_agency on public.wallet_transactions(agency_id, created_at desc);

-- ------------------------------------------------------------
-- Row level security
-- ------------------------------------------------------------
create or replace function public.my_agency_ids()
returns setof uuid
language sql stable security definer set search_path = public as $$
  select agency_id from public.agency_members where user_id = auth.uid()
$$;

alter table public.agencies enable row level security;
alter table public.agency_members enable row level security;
alter table public.wallets enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.project_keys enable row level security;
alter table public.api_calls enable row level security;
alter table public.wallet_transactions enable row level security;

create policy "agencies_member" on public.agencies
  for all using (id in (select public.my_agency_ids()));

create policy "agency_members_self" on public.agency_members
  for select using (user_id = auth.uid());

create policy "wallets_member" on public.wallets
  for select using (agency_id in (select public.my_agency_ids()));

create policy "clients_member" on public.clients
  for all using (agency_id in (select public.my_agency_ids()));

create policy "projects_member" on public.projects
  for all using (agency_id in (select public.my_agency_ids()));

create policy "project_keys_member" on public.project_keys
  for all using (agency_id in (select public.my_agency_ids()));

create policy "api_calls_member" on public.api_calls
  for select using (agency_id in (select public.my_agency_ids()));

create policy "wallet_transactions_member" on public.wallet_transactions
  for select using (agency_id in (select public.my_agency_ids()));

-- Never expose key hashes to the browser session
revoke select (key_hash) on public.project_keys from authenticated, anon;

-- ------------------------------------------------------------
-- Trigger: on signup create user row, agency, membership, wallet
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_agency_id uuid;
  v_agency_name text;
begin
  insert into public.users (id, email)
  values (new.id, new.email);

  v_agency_name := coalesce(
    nullif(new.raw_user_meta_data->>'agency_name', ''),
    split_part(new.email, '@', 1)
  );

  insert into public.agencies (name, owner_user_id)
  values (v_agency_name, new.id)
  returning id into v_agency_id;

  insert into public.agency_members (agency_id, user_id, role)
  values (v_agency_id, new.id, 'owner');

  insert into public.wallets (agency_id, balance_usd)
  values (v_agency_id, 0);

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------
-- Wallet functions (agency scoped)
-- ------------------------------------------------------------
create or replace function public.deduct_wallet(
  p_agency_id uuid,
  p_amount numeric,
  p_description text,
  p_api_call_id uuid default null
)
returns numeric as $$
declare
  v_balance numeric;
begin
  select balance_usd into v_balance
  from public.wallets
  where agency_id = p_agency_id
  for update;

  if v_balance < p_amount then
    raise exception 'insufficient_balance' using detail = v_balance::text;
  end if;

  update public.wallets
  set balance_usd = balance_usd - p_amount,
      updated_at = now()
  where agency_id = p_agency_id;

  insert into public.wallet_transactions (agency_id, type, amount_usd, description, api_call_id)
  values (p_agency_id, 'deduction', p_amount, p_description, p_api_call_id);

  return v_balance - p_amount;
end;
$$ language plpgsql security definer;

create or replace function public.topup_wallet(
  p_agency_id uuid,
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
  where agency_id = p_agency_id
  returning balance_usd into v_new_balance;

  insert into public.wallet_transactions (agency_id, type, amount_usd, description, stripe_payment_intent_id)
  values (p_agency_id, 'topup', p_amount, 'Stripe top-up', p_stripe_payment_intent_id);

  return v_new_balance;
end;
$$ language plpgsql security definer;
