-- ============================================================
-- Migration 010: $3 welcome credit on signup
-- Run in the Supabase SQL Editor after 009.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_agency_id uuid;
  v_agency_name text;
  v_welcome numeric := 3.00;
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
  values (v_agency_id, v_welcome);

  insert into public.wallet_transactions (agency_id, type, amount_usd, description)
  values (v_agency_id, 'topup', v_welcome, 'Welcome credit');

  return new;
end;
$$ language plpgsql security definer;
