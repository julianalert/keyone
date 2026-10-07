import type { CatalogApi } from '@/lib/supabase/types'
import type { TokenUsage } from '@/lib/billing/pricing'

// What the adapter knows about the request when it accounts for a response.
// `path` is the SDK-style path after /api/proxy/<slug>/ (e.g. "v1/images/generations"),
// null when the caller used the bare slug. `body` is the parsed request body
// (scalar form fields for multipart uploads).
export interface UsageContext {
  path: string | null
  body: Record<string, unknown>
}

// How a POST endpoint is accounted for: 'metered' is priced from usage,
// 'free' costs nothing at the provider (token counting, moderation).
export type EndpointBilling = 'metered' | 'free'

// SDK-style path without the leading slash or version prefix: "/v1/messages" → "messages"
export function endpointOf(path: string | null | undefined): string {
  return (path ?? '').replace(/^\/+/, '').replace(/^v1\//, '').replace(/\/+$/, '')
}

// One adapter per upstream provider. Adding a provider = one file here plus
// a catalog_apis row (and model_prices rows if it bills per token).
export interface ProviderAdapter {
  id: string

  // Is the provider's own credential set? Unconfigured providers answer 503
  // instead of forwarding a request that would fail upstream.
  configured(): boolean

  // Where and how to call the provider with key.one's own credentials.
  // `path` is set when the caller used an SDK-style path such as
  // /api/proxy/openai/v1/chat/completions; it replaces the catalog path.
  buildUrl(api: CatalogApi, path?: string): string
  buildHeaders(api: CatalogApi, incoming?: Headers): Record<string, string>

  // Which POST endpoints the adapter can account for (`path` is null on the
  // bare slug). null = not supported: the proxy refuses the call instead of
  // forwarding something it cannot bill. Adapters without this method only
  // serve the bare slug.
  endpoint?(path: string | null, body: Record<string, unknown>): EndpointBilling | null

  // Chance to adjust the outbound JSON body (e.g. ask for usage in streams)
  prepareBody?(body: Record<string, unknown>, ctx: UsageContext): Record<string, unknown>

  // Does this request expect a server-sent-event stream back?
  wantsStream?(body: Record<string, unknown>, ctx: UsageContext): boolean

  // Which price row a request bills against when the body has no `model`
  // (Perplexity's Search API, for one). Return null to leave it unpriced.
  modelFor?(ctx: UsageContext): string | null

  // Token / unit accounting for per_token APIs, from the response…
  usageFromJson?(json: Record<string, unknown>, ctx: UsageContext): TokenUsage | null
  usageFromSse?(events: Record<string, unknown>[], ctx: UsageContext): TokenUsage | null
  // …or from the request when the response carries no usage (TTS audio bytes, DALL·E, search)
  usageFromRequest?(ctx: UsageContext): TokenUsage | null

  // Result accounting for per_result APIs
  resultCount?(json: unknown): number
}
