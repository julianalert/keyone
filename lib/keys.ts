import crypto from 'crypto'

export const KEY_PREFIX = 'kone_live_'
export const KEY_DISPLAY_CHARS = 12

// Generate a new project key. The plaintext is returned once and never stored.
// Keys are 32 random bytes, so a plain SHA-256 is safe and lets the proxy
// look the key up by hash in a single indexed query.
export function generateProjectKey(): { plaintext: string; hash: string; prefix: string } {
  const plaintext = `${KEY_PREFIX}${crypto.randomBytes(32).toString('hex')}`
  return {
    plaintext,
    hash: hashProjectKey(plaintext),
    prefix: plaintext.slice(0, KEY_DISPLAY_CHARS),
  }
}

export function hashProjectKey(plaintext: string): string {
  return crypto.createHash('sha256').update(plaintext).digest('hex')
}

export const ADMIN_KEY_PREFIX = 'kone_admin_'

// Agency keys manage; project keys spend. Same hashing, different prefix.
export function generateAgencyKey(): { plaintext: string; hash: string; prefix: string } {
  const plaintext = `${ADMIN_KEY_PREFIX}${crypto.randomBytes(32).toString('hex')}`
  return { plaintext, hash: hashProjectKey(plaintext), prefix: plaintext.slice(0, ADMIN_KEY_PREFIX.length + 4) }
}

export function isAgencyKey(value: string): boolean {
  return value.startsWith(ADMIN_KEY_PREFIX)
}
