-- ============================================================
-- Migration 017: Agent-initiated onboarding
-- Run in the Supabase SQL Editor after 016.
--
--  * agencies.onboarding_source: 'human' (signed up on the site) or 'agent'
--    (an agent started the signup, or the user came from the skill's link).
--    Agent-sourced agencies get a Sandbox client and a Default project
--    automatically so the agent can start right away.
--  * agent_claims: an agent posts the user's email, we mail a one-click
--    approval link, and once the human clicks, the sandbox project key is
--    parked here for the agent to collect exactly once.
-- ============================================================

alter table public.agencies
  add column if not exists onboarding_source text not null default 'human';

create table if not exists public.agent_claims (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,            -- sha256 of the token the agent holds
  email text not null,
  agent_label text,                            -- e.g. "Claude Code", free text from the agent
  status text not null default 'pending',      -- pending | ready | claimed | expired
  agency_id uuid references public.agencies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  project_key text,                            -- plaintext, only between the human's click and the agent's pickup
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 minutes',
  ready_at timestamptz,
  claimed_at timestamptz
);
create index if not exists idx_agent_claims_email on public.agent_claims(email, created_at desc);

alter table public.agent_claims enable row level security;
-- No policies on purpose: only the service role (platform code) touches this table.

-- Signup trigger: remember where the account came from
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_agency_id uuid;
  v_agency_name text;
  v_welcome numeric := 3.00;
  v_invited uuid;
  v_role text;
  v_source text;
begin
  insert into public.users (id, email)
  values (new.id, new.email);

  v_invited := nullif(new.raw_user_meta_data->>'invited_agency_id', '')::uuid;
  if v_invited is not null and exists (select 1 from public.agencies where id = v_invited) then
    v_role := coalesce(nullif(new.raw_user_meta_data->>'invited_role', ''), 'member');
    if v_role not in ('admin', 'member') then v_role := 'member'; end if;
    insert into public.agency_members (agency_id, user_id, role)
    values (v_invited, new.id, v_role)
    on conflict do nothing;
    return new;
  end if;

  v_agency_name := coalesce(
    nullif(new.raw_user_meta_data->>'agency_name', ''),
    split_part(new.email, '@', 1)
  );
  v_source := case when new.raw_user_meta_data->>'via' = 'agent' then 'agent' else 'human' end;

  insert into public.agencies (name, owner_user_id, onboarding_source)
  values (v_agency_name, new.id, v_source)
  returning id into v_agency_id;

  insert into public.agency_members (agency_id, user_id, role)
  values (v_agency_id, new.id, 'owner');

  insert into public.wallets (agency_id, balance_usd)
  values (v_agency_id, v_welcome);

  insert into public.wallet_transactions (agency_id, type, amount_usd, description)
  values (v_agency_id, 'topup', v_welcome, 'Welcome credit');

  return new;
end;
$$ language plpgsql security definer;
