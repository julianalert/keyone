import { resolveModelPrice, providerCost, userPrice, type TokenUsage, type ModelPrice } from '@/lib/billing/pricing'
import type { CatalogApi } from '@/lib/supabase/types'

export type { TokenUsage }

// Minimum wallet buffer for token-based APIs (cost unknown up front)
export const MIN_BUFFER_USD = 0.10

export const DEFAULT_MAX_OUTPUT_TOKENS = 4096

// Image output tokens per image at 1024×1024, by quality (gpt-image figures)
const IMAGE_TOKENS: Record<string, number> = { low: 272, medium: 1056, high: 4160, xhigh: 6240, max: 8320 }

// Upper-bound usage for a call before it is sent, per kind of model.
function estimateUsage(price: ModelPrice, body: Record<string, unknown>, path: string | null): TokenUsage {
  const n = typeof body.n === 'number' && body.n > 0 ? body.n : 1
  switch (price.kind) {
    case 'image': {
      if (price.unit === 'image') return { input_tokens: 0, output_tokens: 0, units: n * imageFactor(price.model, body) }
      const quality = typeof body.quality === 'string' ? body.quality : 'high'
      const prompt = typeof body.prompt === 'string' ? body.prompt : ''
      return { input_tokens: Math.ceil(prompt.length / 4), output_tokens: 0, image_output_tokens: n * (IMAGE_TOKENS[quality] ?? IMAGE_TOKENS.high) }
    }
    case 'embedding': {
      const input = JSON.stringify(body.input ?? '')
      return { input_tokens: Math.ceil(input.length / 4), output_tokens: 0 }
    }
    case 'speech': {
      const input = typeof body.input === 'string' ? body.input : ''
      return { input_tokens: 0, output_tokens: 0, characters: input.length }
    }
    case 'transcription':
      // Duration is unknown before the upload is processed; assume one minute
      return { input_tokens: 0, output_tokens: 300, minutes: 1, audio_input_tokens: 1000 }
    case 'search':
    case 'tool':
      return { input_tokens: 0, output_tokens: 0, units: 1 }
    default: {
      const promptText = JSON.stringify(body.messages ?? body.input ?? body.prompt ?? body.system ?? '')
      const inputTokens = Math.ceil(promptText.length / 4)
      const rawMax = body.max_tokens ?? body.max_completion_tokens ?? body.max_output_tokens
      const outputTokens = typeof rawMax === 'number' && rawMax > 0 ? rawMax : DEFAULT_MAX_OUTPUT_TOKENS
      void path
      return { input_tokens: inputTokens, output_tokens: outputTokens }
    }
  }
}

// DALL·E bills per image with size/quality multipliers over the 1024² standard price
export function imageFactor(model: string, body: Record<string, unknown>): number {
  const size = typeof body.size === 'string' ? body.size : '1024x1024'
  const quality = typeof body.quality === 'string' ? body.quality : 'standard'
  if (model.startsWith('dall-e-3')) {
    const wide = size !== '1024x1024'
    if (quality === 'hd') return wide ? 3 : 2
    return wide ? 2 : 1
  }
  if (model.startsWith('dall-e-2')) return size === '256x256' ? 0.8 : size === '512x512' ? 0.9 : 1
  return 1
}

// Upper-bound estimate of a priced call before it is sent (per-call cap and
// budget projection). null when the provider has no price rows at all.
export async function estimateTokenCost(provider: string, body: Record<string, unknown>, model?: string | null, path: string | null = null): Promise<number | null> {
  const id = model ?? (typeof body.model === 'string' ? body.model : '')
  const price = await resolveModelPrice(provider, id)
  if (!price) return null
  return userPrice(providerCost(price, estimateUsage(price, body, path)))
}

// Known or estimated price of any catalog call before it is made.
export async function estimateCallCost(catalogApi: CatalogApi, body: Record<string, unknown>, model?: string | null, path: string | null = null): Promise<number | null> {
  if (catalogApi.pricing_model === 'per_call') return catalogApi.price_per_call ?? 0
  if (catalogApi.pricing_model === 'per_token') return estimateTokenCost(catalogApi.provider, body, model, path)
  return catalogApi.price_per_result ?? null   // one result's worth
}
