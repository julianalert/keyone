import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

const LIMIT = 100 // requests per minute per key

let ratelimit: Ratelimit | null | undefined

// Returns null when Upstash isn't configured (placeholder or missing env),
// so local development works without Redis. Production must set real values.
function getRateLimiter(): Ratelimit | null {
  if (ratelimit !== undefined) return ratelimit

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  const configured = !!url && !!token && url.startsWith('https://') && !url.includes('your-redis')

  if (!configured) {
    console.warn('[rate-limit] Upstash not configured; rate limiting disabled')
    ratelimit = null
    return null
  }

  ratelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(LIMIT, '1 m'),
    analytics: true,
    prefix: 'keyone:ratelimit',
  })
  return ratelimit
}

const OPEN = { success: true, limit: LIMIT, remaining: LIMIT, reset: 0 }

export async function checkRateLimit(identifier: string): Promise<{
  success: boolean
  limit: number
  remaining: number
  reset: number
}> {
  const limiter = getRateLimiter()
  if (!limiter) return OPEN

  try {
    const result = await limiter.limit(identifier)
    return { success: result.success, limit: result.limit, remaining: result.remaining, reset: result.reset }
  } catch (err) {
    // Fail open: a Redis outage must not take the proxy down
    console.error('[rate-limit] Upstash unreachable, allowing request:', err)
    return OPEN
  }
}
