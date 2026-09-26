-- ============================================================
-- Migration 012: Refunds reverse wallet credits
-- Run in the Supabase SQL Editor after 011.
-- ============================================================

-- Idempotent by reference (the Stripe refund id): a retried webhook
-- can't debit twice. The balance may go negative; the proxy already
-- refuses calls when it does.
create or replace function public.refund_wallet(
  p_agency_id uuid,
  p_amount numeric,
  p_reference text,
  p_description text
)
returns table (applied boolean, balance_usd numeric) as $$
declare
  v_balance numeric;
begin
  if exists (select 1 from public.wallet_transactions where stripe_payment_intent_id = p_reference) then
    select w.balance_usd into v_balance from public.wallets w where w.agency_id = p_agency_id;
    return query select false, v_balance;
    return;
  end if;

  update public.wallets
  set balance_usd = wallets.balance_usd - p_amount,
      updated_at = now()
  where agency_id = p_agency_id
  returning wallets.balance_usd into v_balance;

  insert into public.wallet_transactions (agency_id, type, amount_usd, description, stripe_payment_intent_id)
  values (p_agency_id, 'deduction', p_amount, p_description, p_reference);

  return query select true, v_balance;
end;
$$ language plpgsql security definer;
