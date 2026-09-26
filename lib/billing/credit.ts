import type Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'
import { raiseAlert } from '@/lib/notify'
import { appUrl } from '@/lib/config'

export interface CreditResult { credited: boolean; balance_usd: number; amount_usd: number; agency_id: string }

// Credit a wallet for a succeeded payment intent. Idempotent: the DB function
// refuses to credit the same intent twice, so the webhook and the client-side
// confirmation can both call this safely.
export async function creditPaymentIntent(supabase: SupabaseClient, intent: Stripe.PaymentIntent, origin: string): Promise<CreditResult> {
  if (intent.status !== 'succeeded') throw new Error(`Payment intent is ${intent.status}, not succeeded`)
  const agencyId = intent.metadata?.agency_id
  if (!agencyId) throw new Error('Payment intent has no agency_id in metadata')
  if (intent.metadata?.type !== 'wallet_topup') throw new Error('Payment intent is not a wallet top-up')

  const amount = intent.amount_received / 100
  const { data, error } = await supabase
    .rpc('topup_wallet', { p_agency_id: agencyId, p_amount: amount, p_stripe_payment_intent_id: intent.id })
    .single()
  if (error) throw new Error(error.message)
  const row = data as { credited: boolean; balance_usd: number | string }
  const result = { credited: !!row.credited, balance_usd: Number(row.balance_usd), amount_usd: amount, agency_id: agencyId }

  if (result.credited) {
    await raiseAlert(supabase, {
      agency_id: agencyId,
      kind: 'wallet_topup',
      scope: 'agency',
      scope_id: agencyId,
      dedupe_key: `topup:${intent.id}`,
      title: `Receipt: $${amount.toFixed(2)} added to your key.one wallet`,
      body: `Your balance is now $${result.balance_usd.toFixed(2)}. Payment reference ${intent.id}.`,
      data: { payment_intent_id: intent.id, amount_usd: amount, links: { 'Open wallet': `${appUrl(origin)}/dashboard/wallet` } },
    })
  }
  return result
}
