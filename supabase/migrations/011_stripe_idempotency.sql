-- ============================================================
-- Migration 011: Idempotent Stripe credits
-- Run in the Supabase SQL Editor after 010.
-- A payment intent can be reported twice (webhook retry, plus the
-- client-side confirmation). It must credit the wallet exactly once.
-- ============================================================

create unique index if not exists uq_wallet_transactions_payment_intent
  on public.wallet_transactions(stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

-- The return type changes (numeric → table), so the old function must go first
drop function if exists public.topup_wallet(uuid, numeric, text);

create function public.topup_wallet(
  p_agency_id uuid,
  p_amount numeric,
  p_stripe_payment_intent_id text
)
returns table (credited boolean, balance_usd numeric) as $$
declare
  v_balance numeric;
begin
  -- Already credited: return the current balance, credit nothing
  if p_stripe_payment_intent_id is not null and exists (
    select 1 from public.wallet_transactions where stripe_payment_intent_id = p_stripe_payment_intent_id
  ) then
    select w.balance_usd into v_balance from public.wallets w where w.agency_id = p_agency_id;
    return query select false, v_balance;
    return;
  end if;

  update public.wallets
  set balance_usd = wallets.balance_usd + p_amount,
      updated_at = now()
  where agency_id = p_agency_id
  returning wallets.balance_usd into v_balance;

  insert into public.wallet_transactions (agency_id, type, amount_usd, description, stripe_payment_intent_id)
  values (p_agency_id, 'topup', p_amount, 'Card top-up', p_stripe_payment_intent_id);

  return query select true, v_balance;
end;
$$ language plpgsql security definer;
