import { resolveModelPrice, providerCost, userPrice, type TokenUsage } from '@/lib/billing/pricing'
import type { CatalogApi } from '@/lib/supabase/types'

export type { TokenUsage }

// Minimum wallet buffer for token-based APIs (cost unknown up front)
export const MIN_BUFFER_USD = 0.10

export const DEFAULT_MAX_OUTPUT_TOKENS = 4096

// Upper-bound estimate of a per-token call before it is sent (per-call cap
// and budget projection). Input ≈ 4 chars per token; output = max_tokens or
// a conservative default. null when the provider has no price rows at all.
export async function estimateTokenCost(provider: string, body: Record<string, unknown>): Promise<number | null> {
  const model = typeof body.model === 'string' ? body.model : ''
  const price = await resolveModelPrice(provider, model)
  if (!price) return null

  const promptText = JSON.stringify(body.messages ?? body.input ?? body.prompt ?? body.system ?? '')
  const inputTokens = Math.ceil(promptText.length / 4)
  const rawMax = body.max_tokens ?? body.max_completion_tokens ?? body.max_output_tokens
  const outputTokens = typeof rawMax === 'number' && rawMax > 0 ? rawMax : DEFAULT_MAX_OUTPUT_TOKENS

  return userPrice(providerCost(price, { input_tokens: inputTokens, output_tokens: outputTokens }))
}

// Known or estimated price of any catalog call before it is made.
export async function estimateCallCost(catalogApi: CatalogApi, body: Record<string, unknown>): Promise<number | null> {
  if (catalogApi.pricing_model === 'per_call') return catalogApi.price_per_call ?? 0
  if (catalogApi.pricing_model === 'per_token') return estimateTokenCost(catalogApi.provider, body)
  return catalogApi.price_per_result ?? null   // one result's worth
}
