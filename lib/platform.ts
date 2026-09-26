// Platform-owner access: emails listed in PLATFORM_ADMIN_EMAILS (comma-separated).
// Nothing agency-facing depends on this; it only unlocks /admin.
export function isPlatformAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  const list = (process.env.PLATFORM_ADMIN_EMAILS ?? '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  return list.includes(email.toLowerCase())
}

// Stripe's published card fee. Used for the net-margin estimate only.
export const STRIPE_FEE_PCT = 0.029
export const STRIPE_FEE_FIXED_USD = 0.30
