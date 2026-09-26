import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function stripeConfigured(): boolean {
  const k = process.env.STRIPE_SECRET_KEY ?? ''
  return (k.startsWith('sk_test_') || k.startsWith('sk_live_')) && !k.endsWith('...')
}

export function isTestMode(): boolean {
  return (process.env.STRIPE_SECRET_KEY ?? '').startsWith('sk_test_')
}

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!stripeConfigured()) throw new Error('Stripe is not configured (STRIPE_SECRET_KEY)')
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { typescript: true })
  }
  return _stripe
}

// Minimum top-up. Default $5 covers Stripe's fixed fee with room to spare;
// set TOP_UP_MIN_USD=1 temporarily to verify live payments cheaply.
export const TOP_UP_MIN_USD = (() => {
  const n = Number(process.env.TOP_UP_MIN_USD ?? 5)
  return Number.isFinite(n) && n >= 0.5 ? n : 5
})()
export const TOP_UP_MAX_USD = 5000
export const TOP_UP_AMOUNTS = [10, 25, 50, 100, 250]
