import { NextRequest, NextResponse } from 'next/server'
import { getSessionContext, unauthorizedResponse } from '@/lib/agency'
import { stripe } from '@/lib/billing/stripe'

// POST /api/wallet/topup — create a Stripe payment intent for the agency wallet
export async function POST(req: NextRequest) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  const { supabase, userId, agencyId } = ctx

  const body = await req.json()
  const amount = Number(body.amount_usd)

  if (!amount || amount < 1 || amount > 1000) {
    return NextResponse.json({ error: 'Amount must be between $1 and $1000' }, { status: 400 })
  }

  const [{ data: agency }, { data: userRecord }] = await Promise.all([
    supabase.from('agencies').select('id, name, stripe_customer_id').eq('id', agencyId).single(),
    supabase.from('users').select('email').eq('id', userId).single(),
  ])

  let customerId = agency?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userRecord?.email ?? undefined,
      name: agency?.name,
      metadata: { agency_id: agencyId, supabase_user_id: userId },
    })
    customerId = customer.id

    await supabase.from('agencies').update({ stripe_customer_id: customerId }).eq('id', agencyId)
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: 'usd',
    customer: customerId,
    metadata: { agency_id: agencyId, user_id: userId, type: 'wallet_topup' },
    description: `key.one wallet top-up — $${amount}`,
  })

  return NextResponse.json({
    client_secret: paymentIntent.client_secret,
    payment_intent_id: paymentIntent.id,
    amount_usd: amount,
  })
}
