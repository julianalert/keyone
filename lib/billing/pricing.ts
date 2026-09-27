import { createServiceClient } from '@/lib/supabase/server'

// Margin on top of wholesale, as a percent. 30 → user pays 1.3× list.
export function marginMultiplier(): number {
  const pct = Number(process.env.KEYONE_MARGIN_PCT ?? 30)
  return 1 + (Number.isFinite(pct) ? pct : 30) / 100
}

// What a price row bills: text tokens (default), characters (TTS), minutes
// (transcription by duration), requests (search / tool fees) or images.
export type PriceUnit = 'token' | 'character' | 'minute' | 'request' | 'image'

// What the model is for; drives the catalog grouping and the shortcuts.
export type PriceKind = 'chat' | 'image' | 'embedding' | 'speech' | 'transcription' | 'audio' | 'moderation' | 'search' | 'tool' | 'legacy'

export interface ModelPrice {
  provider: string
  model: string
  kind: PriceKind
  unit: PriceUnit
  input_per_million: number
  output_per_million: number
  cached_input_per_million: number | null
  per_unit: number | null                     // minute / request / image price
  image_input_per_million: number | null
  image_output_per_million: number | null
  audio_input_per_million: number | null
  audio_output_per_million: number | null
}

export type PricingStatus = 'exact' | 'alias' | 'fallback' | 'unknown'

export interface ResolvedPrice extends ModelPrice {
  status: PricingStatus
  requested_model: string
}

// Everything a call can be billed for. Text tokens are the common case;
// the rest is filled in by the provider adapter for the endpoint it saw.
export interface TokenUsage {
  input_tokens: number                // uncached text input
  output_tokens: number               // text output (thinking included)
  cached_input_tokens?: number        // served from cache, billed at the cached rate
  cache_write_tokens?: number         // 5-minute cache writes, 1.25× input
  cache_write_1h_tokens?: number      // Anthropic 1-hour cache writes, 2× input
  image_input_tokens?: number
  image_output_tokens?: number
  audio_input_tokens?: number
  audio_output_tokens?: number
  characters?: number                 // text-to-speech input
  minutes?: number                    // transcription by duration
  units?: number                      // requests or images for per_unit rows (default 1)
  tool_calls?: Record<string, number> // hosted tool invocations, priced from the provider's 'tool:<name>' rows
  multiplier?: number                 // service tier multiplier (Anthropic fast mode = 2)
  reported_cost_usd?: number          // the provider said what it cost; wins over everything else
}

// ------------------------------------------------------------
// Price table cache: one query per minute across all requests
// ------------------------------------------------------------
const TTL_MS = 60_000
let cache: { at: number; rows: ModelPrice[] } | null = null

const num = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v))

async function loadPrices(): Promise<ModelPrice[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.rows
  const supabase = createServiceClient()
  type Row = Record<string, unknown>
  let data: Row[] | null = null
  const full = await supabase
    .from('model_prices')
    .select('provider, model, kind, unit, input_per_million, output_per_million, cached_input_per_million, per_unit, image_input_per_million, image_output_per_million, audio_input_per_million, audio_output_per_million')
    .eq('is_active', true)
  if (full.error) {
    // Migration 016 not applied yet: fall back to the text-only columns so nothing bills for free
    console.error('[pricing] model_prices query failed, using text-only columns:', full.error.message)
    const basic = await supabase
      .from('model_prices')
      .select('provider, model, input_per_million, output_per_million, cached_input_per_million')
      .eq('is_active', true)
    if (basic.error) console.error('[pricing] model_prices unavailable:', basic.error.message)
    data = basic.data as Row[] | null
  } else {
    data = full.data as Row[] | null
  }
  const rows: ModelPrice[] = (data ?? []).map(r => ({
    provider: String(r.provider),
    model: String(r.model),
    kind: ((r.kind as string | undefined) ?? 'chat') as PriceKind,
    unit: ((r.unit as string | undefined) ?? 'token') as PriceUnit,
    input_per_million: Number(r.input_per_million),
    output_per_million: Number(r.output_per_million),
    cached_input_per_million: num(r.cached_input_per_million),
    per_unit: num(r.per_unit),
    image_input_per_million: num(r.image_input_per_million),
    image_output_per_million: num(r.image_output_per_million),
    audio_input_per_million: num(r.audio_input_per_million),
    audio_output_per_million: num(r.audio_output_per_million),
  }))
  cache = { at: Date.now(), rows }
  return rows
}

export function invalidatePriceCache() {
  cache = null
}

// Exact id → id without a date suffix → longest known prefix → provider '*'.
// "claude-haiku-4-5-20251001" resolves to "claude-haiku-4-5" as an alias;
// "gpt-6-sol-2026-08-01" resolves to "gpt-6-sol" by prefix.
export async function resolveModelPrice(provider: string, model: string): Promise<ResolvedPrice | null> {
  const rows = (await loadPrices()).filter(r => r.provider === provider)
  if (rows.length === 0) return null

  const exact = rows.find(r => r.model === model)
  if (exact) return { ...exact, status: 'exact', requested_model: model }

  const undated = model.replace(/-\d{8}$/, '').replace(/-\d{4}-\d{2}-\d{2}$/, '')
  if (undated !== model) {
    const alias = rows.find(r => r.model === undated)
    if (alias) return { ...alias, status: 'alias', requested_model: model }
  }

  const prefix = rows
    .filter(r => r.model !== '*' && r.kind !== 'tool' && model.startsWith(r.model + '-'))
    .sort((a, b) => b.model.length - a.model.length)[0]
  if (prefix) return { ...prefix, status: 'alias', requested_model: model }

  const fallback = rows.find(r => r.model === '*')
  if (fallback) return { ...fallback, status: 'fallback', requested_model: model }

  return null
}

// Wholesale cost of one call, before tool fees.
export function providerCost(price: ModelPrice, usage: TokenUsage): number {
  if (usage.reported_cost_usd !== undefined) return usage.reported_cost_usd
  const m = usage.multiplier ?? 1

  if (price.unit === 'character') return m * ((usage.characters ?? 0) / 1e6) * price.input_per_million
  if (price.unit === 'minute') {
    // Duration when the provider reports it; otherwise OpenAI's ~1,000 audio tokens per minute
    const minutes = usage.minutes ?? (usage.audio_input_tokens ?? 0) / 1000
    return m * minutes * (price.per_unit ?? 0)
  }
  if (price.unit === 'request' || price.unit === 'image') return m * (usage.units ?? 1) * (price.per_unit ?? 0)

  const cachedRate = price.cached_input_per_million ?? price.input_per_million
  const input = (usage.input_tokens / 1e6) * price.input_per_million
  const cached = ((usage.cached_input_tokens ?? 0) / 1e6) * cachedRate
  const cacheWrite = ((usage.cache_write_tokens ?? 0) / 1e6) * price.input_per_million * 1.25
  const cacheWrite1h = ((usage.cache_write_1h_tokens ?? 0) / 1e6) * price.input_per_million * 2
  const output = (usage.output_tokens / 1e6) * price.output_per_million
  const imageIn = ((usage.image_input_tokens ?? 0) / 1e6) * (price.image_input_per_million ?? price.input_per_million)
  const imageOut = ((usage.image_output_tokens ?? 0) / 1e6) * (price.image_output_per_million ?? price.output_per_million)
  const audioIn = ((usage.audio_input_tokens ?? 0) / 1e6) * (price.audio_input_per_million ?? price.input_per_million)
  const audioOut = ((usage.audio_output_tokens ?? 0) / 1e6) * (price.audio_output_per_million ?? price.output_per_million)
  return m * (input + cached + cacheWrite + cacheWrite1h + output + imageIn + imageOut + audioIn + audioOut)
}

// Hosted tool fees (web search, file search, URL fetch…) from the provider's 'tool:<name>' rows.
// Unknown tools cost nothing here; they still show up in usage_detail.
export async function toolFees(provider: string, toolCalls: Record<string, number> | undefined): Promise<number> {
  if (!toolCalls) return 0
  const rows = (await loadPrices()).filter(r => r.provider === provider && r.kind === 'tool')
  let total = 0
  for (const [name, n] of Object.entries(toolCalls)) {
    const row = rows.find(r => r.model === `tool:${name}`)
    if (row) total += n * (row.per_unit ?? 0)
  }
  return total
}

export function userPrice(providerCostUsd: number): number {
  return providerCostUsd * marginMultiplier()
}

export interface UserPrice {
  provider: string
  model: string
  kind: PriceKind
  unit: PriceUnit
  input_per_million: number
  output_per_million: number
  cached_input_per_million: number | null
  per_unit: number | null
  image_input_per_million: number | null
  image_output_per_million: number | null
  audio_input_per_million: number | null
  audio_output_per_million: number | null
}

// Public view of the table with user prices applied
export async function listUserPrices(): Promise<UserPrice[]> {
  const m = marginMultiplier()
  const up = (v: number | null, digits = 4) => (v === null ? null : +(v * m).toFixed(digits))
  return (await loadPrices())
    .filter(r => r.model !== '*')
    .map(r => ({
      provider: r.provider,
      model: r.model,
      kind: r.kind,
      unit: r.unit,
      input_per_million: up(r.input_per_million)!,
      output_per_million: up(r.output_per_million)!,
      cached_input_per_million: up(r.cached_input_per_million),
      per_unit: up(r.per_unit, 6),
      image_input_per_million: up(r.image_input_per_million),
      image_output_per_million: up(r.image_output_per_million),
      audio_input_per_million: up(r.audio_input_per_million),
      audio_output_per_million: up(r.audio_output_per_million),
    }))
    .sort((a, b) => a.provider.localeCompare(b.provider) || a.model.localeCompare(b.model))
}
