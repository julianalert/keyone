import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe, stripeConfigured } from '@/lib/billing/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { creditPaymentIntent } from '@/lib/billing/credit'
import { appUrl } from '@/lib/config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/webhooks/stripe
// Configure in Stripe → Developers → Webhooks with events:
//   payment_intent.succeeded, payment_intent.payment_failed, charge.refunded
export async function POST(req: NextRequest) {
  if (!stripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Stripe webhook not configured' }, { status: 503 })
  }
  const signature = req.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })

  const raw = await req.text()
  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(raw, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const intent = event.data.object as Stripe.PaymentIntent
      if (intent.metadata?.type !== 'wallet_topup') break   // not ours
      try {
        const r = await creditPaymentIntent(supabase, intent, appUrl(new URL(req.url).origin))
        console.log(`[stripe] ${intent.id}: ${r.credited ? `credited $${r.amount_usd}` : 'already credited'} → balance $${r.balance_usd}`)
      } catch (err) {
        console.error('[stripe] credit failed:', err)
        // 500 makes Stripe retry, which is what we want for a transient DB error
        return NextResponse.json({ error: 'credit failed' }, { status: 500 })
      }
      break
    }
    case 'charge.refunded': {
      // A refund (full or partial) takes the credit back out of the wallet.
      const charge = event.data.object as Stripe.Charge
      const piId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id
      if (!piId) break
      const intent = await getStripe().paymentIntents.retrieve(piId)
      const agencyId = intent.metadata?.agency_id
      if (intent.metadata?.type !== 'wallet_topup' || !agencyId) break
      const refunds = charge.refunds?.data ?? []
      for (const r of refunds) {
        const amount = r.amount / 100
        const { data, error } = await supabase
          .rpc('refund_wallet', { p_agency_id: agencyId, p_amount: amount, p_reference: `refund:${r.id}`, p_description: `Refund of ${piId}` })
          .single()
        if (error) {
          console.error('[stripe] refund debit failed:', error.message)
          return NextResponse.json({ error: 'refund failed' }, { status: 500 })
        }
        const row = data as { applied: boolean; balance_usd: number | string }
        console.log(`[stripe] ${r.id}: ${row.applied ? `debited $${amount}` : 'already applied'} → balance $${Number(row.balance_usd)}`)
      }
      break
    }
    case 'payment_intent.payment_failed': {
      const intent = event.data.object as Stripe.PaymentIntent
      console.warn(`[stripe] payment failed ${intent.id}: ${intent.last_payment_error?.message ?? 'unknown'}`)
      break
    }
    default:
      break
  }

  return NextResponse.json({ received: true })
}
