import type { CatalogApi } from '@/lib/supabase/types'
import type { TokenUsage } from '@/lib/billing/pricing'

// One adapter per upstream provider. Adding a provider = one file here plus
// a catalog_apis row (and model_prices rows if it bills per token).
export interface ProviderAdapter {
  id: string

  // Where and how to call the provider with key.one's own credentials.
  // `path` is set when the caller used an SDK-style path such as
  // /api/proxy/openai/v1/chat/completions; it replaces the catalog path.
  buildUrl(api: CatalogApi, path?: string): string
  buildHeaders(api: CatalogApi, incoming?: Headers): Record<string, string>

  // Chance to adjust the outbound body (e.g. ask for usage in streams)
  prepareBody?(body: Record<string, unknown>): Record<string, unknown>

  // Does this request expect a server-sent-event stream back?
  wantsStream?(body: Record<string, unknown>): boolean

  // Token accounting for per_token APIs
  usageFromJson?(json: Record<string, unknown>): TokenUsage | null
  usageFromSse?(events: Record<string, unknown>[]): TokenUsage | null

  // Result accounting for per_result APIs
  resultCount?(json: unknown): number
}
