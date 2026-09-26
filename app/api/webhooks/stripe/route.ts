import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/billing/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { inngest } from '@/lib/inngest/client'

export const runtime = 'nodejs'

// POST /api/webhooks/stripe — handle Stripe events
export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object
    const agencyId = intent.metadata?.agency_id
    const amountUsd = intent.amount / 100 // cents to dollars

    if (!agencyId) {
      console.error('No agency_id in payment_intent metadata')
      return NextResponse.json({ error: 'Missing agency_id' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Credit the wallet
    await supabase.rpc('topup_wallet', {
      p_agency_id: agencyId,
      p_amount: amountUsd,
      p_stripe_payment_intent_id: intent.id,
    }).throwOnError()

    // Send confirmation email via Inngest
    await inngest.send({
      name: 'wallet/topped-up',
      data: { agency_id: agencyId, amount_usd: amountUsd, payment_intent_id: intent.id },
    })
  }

  return NextResponse.json({ received: true })
}
