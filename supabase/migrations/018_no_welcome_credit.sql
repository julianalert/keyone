-- ============================================================
-- Migration 018: No welcome credit
-- Run in the Supabase SQL Editor after 017.
--
-- New agencies start with an empty wallet. The $3 welcome credit
-- (migration 010) was being farmed with throwaway signups. Wallets
-- that already exist keep their balance.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_agency_id uuid;
  v_agency_name text;
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
  values (v_agency_id, 0);

  return new;
end;
$$ language plpgsql security definer;
