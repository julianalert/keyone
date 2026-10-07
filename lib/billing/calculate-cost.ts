import { resolveModelPrice, providerCost, userPrice, type TokenUsage, type ModelPrice } from '@/lib/billing/pricing'
import type { CatalogApi } from '@/lib/supabase/types'

export type { TokenUsage }

// Minimum wallet buffer for token-based APIs (cost unknown up front)
export const MIN_BUFFER_USD = 0.10

export const DEFAULT_MAX_OUTPUT_TOKENS = 4096

// Image output tokens per image at 1024×1024, by quality (gpt-image figures)
const IMAGE_TOKENS: Record<string, number> = { low: 272, medium: 1056, high: 4160, xhigh: 6240, max: 8320 }

// Rough token count for text we have not sent yet. ASCII runs about four
// characters per token; CJK and other non-ASCII text runs well over a token
// per character (a 134k-character Chinese prompt measured 156k tokens).
export function roughTokens(text: string): number {
  let wide = 0
  for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) > 0x7f) wide++
  return Math.ceil((text.length - wide) / 4 + wide * 1.5)
}

// Inline media (base64 images, PDFs, audio) is billed for what it holds, not
// for its length: each one counts as a flat allowance and the rest is measured
// as text. Media is recognised by where it sits in the request, never by what
// a string looks like, so a wall of text cannot pass for an image.
const MEDIA_TOKENS = 3000

function promptTokens(value: unknown): number {
  let media = 0
  const text = JSON.stringify(value, function (this: Record<string, unknown>, key: string, v: unknown) {
    if (typeof v !== 'string' || v.length < 2000) return v
    const inline =
      v.startsWith('data:') ||                                                        // image_url / file data URLs
      (key === 'data' && (this.type === 'base64' || typeof this.format === 'string')) ||  // Anthropic source, OpenAI input_audio
      key === 'file_data'
    if (!inline) return v
    media++
    return ''
  })
  return roughTokens(text ?? '') + media * MEDIA_TOKENS
}

// Everything in a request that the model reads as input
const PROMPT_FIELDS = ['system', 'instructions', 'messages', 'input', 'prompt', 'tools']

// Upper-bound usage for a call before it is sent, per kind of model.
// `outputTokens` replaces the max_tokens bound when the output is already
// known (a stream that was cut short).
export function estimateUsage(price: ModelPrice, body: Record<string, unknown>, path: string | null, outputTokens?: number): TokenUsage {
  const n = typeof body.n === 'number' && body.n > 0 ? body.n : 1
  switch (price.kind) {
    case 'image': {
      if (price.unit === 'image') return { input_tokens: 0, output_tokens: 0, units: n * imageFactor(price.model, body) }
      const quality = typeof body.quality === 'string' ? body.quality : 'high'
      const prompt = typeof body.prompt === 'string' ? body.prompt : ''
      return { input_tokens: Math.ceil(prompt.length / 4), output_tokens: 0, image_output_tokens: n * (IMAGE_TOKENS[quality] ?? IMAGE_TOKENS.high) }
    }
    case 'embedding':
      return { input_tokens: roughTokens(JSON.stringify(body.input ?? '')), output_tokens: 0 }
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
      const inputTokens = PROMPT_FIELDS.reduce((sum, f) => sum + (body[f] === undefined ? 0 : promptTokens(body[f])), 0)
      const rawMax = body.max_tokens ?? body.max_completion_tokens ?? body.max_output_tokens
      const maxOutput = typeof rawMax === 'number' && rawMax > 0 ? rawMax : DEFAULT_MAX_OUTPUT_TOKENS
      void path
      return { input_tokens: inputTokens, output_tokens: outputTokens ?? maxOutput }
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
