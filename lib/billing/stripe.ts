import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Missing STRIPE_SECRET_KEY')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-04-22.dahlia',
      typescript: true,
    })
  }
  return _stripe
}

// Re-export for convenience in webhook handler (needs raw Stripe instance)
export const stripe = {
  get webhooks() { return getStripe().webhooks },
  get customers() { return getStripe().customers },
  get paymentIntents() { return getStripe().paymentIntents },
}

export const TOP_UP_AMOUNTS = [10, 25, 50, 100] // USD
