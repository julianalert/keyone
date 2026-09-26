import { NextRequest, NextResponse } from 'next/server'
import { getSessionContext, unauthorizedResponse } from '@/lib/agency'
import { createServiceClient } from '@/lib/supabase/server'
import { getStripe, stripeConfigured } from '@/lib/billing/stripe'
import { creditPaymentIntent } from '@/lib/billing/credit'

// POST /api/wallet/topup/confirm { payment_intent_id }
// Called by the wallet page right after the card is confirmed, so the balance
// updates without waiting for the webhook. Verified against Stripe, never
// trusted from the client, and idempotent with the webhook.
export async function POST(req: NextRequest) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  if (ctx.via !== 'session') return NextResponse.json({ error: 'Dashboard only' }, { status: 403 })
  if (!stripeConfigured()) return NextResponse.json({ error: 'Payments are not configured yet' }, { status: 503 })

  const body = await req.json().catch(() => ({}))
  const id = typeof body.payment_intent_id === 'string' ? body.payment_intent_id : ''
  if (!id.startsWith('pi_')) return NextResponse.json({ error: 'payment_intent_id required' }, { status: 400 })

  const intent = await getStripe().paymentIntents.retrieve(id)
  if (intent.metadata?.agency_id !== ctx.agencyId) return NextResponse.json({ error: 'Not your payment' }, { status: 403 })
  if (intent.status !== 'succeeded') return NextResponse.json({ status: intent.status, credited: false }, { status: 202 })

  try {
    const r = await creditPaymentIntent(createServiceClient(), intent, new URL(req.url).origin)
    return NextResponse.json({ status: 'succeeded', ...r })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
