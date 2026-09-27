import type { ProviderAdapter } from './types'

// Async provider: the run is started here, results are fetched by the
// poll route (see lib/proxy/async.ts). Token goes in the query string.
export const apify: ProviderAdapter = {
  id: 'apify',
  configured: () => !!process.env.APIFY_TOKEN,
  buildUrl: api => `${api.base_url}?token=${process.env.APIFY_TOKEN}`,
  buildHeaders: () => ({ 'Content-Type': 'application/json' }),
  resultCount: json => (Array.isArray(json) ? json.length : 0),
}
