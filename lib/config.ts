// Deployment-level settings, read from the environment with safe defaults.

// Public base URL of the app, without a trailing slash.
// Falls back to the request origin when unset (local dev).
export function appUrl(fallbackOrigin?: string): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim()
  const base = raw && raw.length > 0 ? raw : fallbackOrigin ?? ''
  return base.replace(/\/+$/, '')
}

// Sender for transactional email. The domain must be verified in Resend.
export function fromEmail(kind: 'alerts' | 'receipts' = 'alerts'): string {
  const override = process.env.EMAIL_FROM?.trim()
  if (override) return override
  const host = (() => {
    try { return new URL(appUrl('https://getkeyone.com')).hostname } catch { return 'getkeyone.com' }
  })()
  return `key.one <${kind}@${host}>`
}
