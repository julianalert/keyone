import { NextRequest, NextResponse } from 'next/server'
import { getSessionContext, unauthorizedResponse } from '@/lib/agency'
import { getStripe, stripeConfigured, isTestMode, TOP_UP_MIN_USD, TOP_UP_MAX_USD } from '@/lib/billing/stripe'

// POST /api/wallet/topup — create a payment intent for the agency wallet.
// Dashboard session only: an agency key must never be able to charge a card.
export async function POST(req: NextRequest) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  if (ctx.via !== 'session') return NextResponse.json({ error: 'Top-ups are only available from the dashboard' }, { status: 403 })
  if (!stripeConfigured()) return NextResponse.json({ error: 'Payments are not configured yet' }, { status: 503 })
  const { supabase, userId, agencyId } = ctx

  const body = await req.json().catch(() => ({}))
  const amount = Math.round(Number(body.amount_usd) * 100) / 100
  if (!Number.isFinite(amount) || amount < TOP_UP_MIN_USD || amount > TOP_UP_MAX_USD) {
    return NextResponse.json({ error: `Amount must be between $${TOP_UP_MIN_USD} and $${TOP_UP_MAX_USD}` }, { status: 400 })
  }

  const stripe = getStripe()
  const [{ data: agency }, { data: userRecord }] = await Promise.all([
    supabase.from('agencies').select('id, name, stripe_customer_id').eq('id', agencyId).single(),
    supabase.from('users').select('email').eq('id', userId!).single(),
  ])

  let customerId = agency?.stripe_customer_id ?? null
  if (customerId) {
    // A customer created in the other Stripe mode (test vs live) doesn't exist here
    try { await stripe.customers.retrieve(customerId) } catch { customerId = null }
  }
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userRecord?.email ?? undefined,
      name: agency?.name,
      metadata: { agency_id: agencyId, supabase_user_id: userId! },
    })
    customerId = customer.id
    await supabase.from('agencies').update({ stripe_customer_id: customerId }).eq('id', agencyId)
  }

  const intent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: 'usd',
    customer: customerId,
    automatic_payment_methods: { enabled: true },
    metadata: { agency_id: agencyId, user_id: userId!, type: 'wallet_topup' },
    description: `key.one wallet top-up: $${amount.toFixed(2)} (${agency?.name ?? agencyId})`,
    receipt_email: userRecord?.email ?? undefined,
  })

  return NextResponse.json({
    client_secret: intent.client_secret,
    payment_intent_id: intent.id,
    amount_usd: amount,
    test_mode: isTestMode(),
  })
}
