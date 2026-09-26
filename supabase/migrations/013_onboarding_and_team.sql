-- ============================================================
-- Migration 013: Onboarding state + team invites
-- Run in the Supabase SQL Editor after 012.
-- ============================================================

alter table public.agencies
  add column if not exists welcome_sent_at timestamptz,
  add column if not exists onboarding_dismissed_at timestamptz;

-- Members may see each other; owners and admins manage the roster
drop policy if exists "agency_members_self" on public.agency_members;
create policy "agency_members_read" on public.agency_members
  for select using (agency_id in (select public.my_agency_ids()));
-- Must go through a security-definer function: a policy on agency_members
-- can't select from agency_members directly (infinite recursion).
create or replace function public.my_admin_agency_ids()
returns setof uuid
language sql stable security definer set search_path = public as $$
  select agency_id from public.agency_members
  where user_id = auth.uid() and role in ('owner', 'admin')
$$;

create policy "agency_members_manage" on public.agency_members
  for all using (agency_id in (select public.my_admin_agency_ids()));

-- Members can read their agency-mates' emails (for the team list)
create policy "users_agency_mates" on public.users
  for select using (
    id in (
      select m.user_id from public.agency_members m
      where m.agency_id in (select public.my_agency_ids())
    )
  );

-- Signup trigger: an invited user joins the inviting agency instead of
-- getting a new one. The invite carries invited_agency_id in metadata.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_agency_id uuid;
  v_agency_name text;
  v_welcome numeric := 3.00;
  v_invited uuid;
  v_role text;
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

  insert into public.agencies (name, owner_user_id)
  values (v_agency_name, new.id)
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
