import { createServiceClient } from '@/lib/supabase/server'

// Margin on top of wholesale, as a percent. 30 → user pays 1.3× list.
export function marginMultiplier(): number {
  const pct = Number(process.env.KEYONE_MARGIN_PCT ?? 30)
  return 1 + (Number.isFinite(pct) ? pct : 30) / 100
}

export interface ModelPrice {
  provider: string
  model: string
  input_per_million: number
  output_per_million: number
  cached_input_per_million: number | null
}

export type PricingStatus = 'exact' | 'alias' | 'fallback' | 'unknown'

export interface ResolvedPrice extends ModelPrice {
  status: PricingStatus
  requested_model: string
}

export interface TokenUsage {
  input_tokens: number          // uncached input
  output_tokens: number
  cached_input_tokens?: number  // served from cache, billed at the cached rate
  cache_write_tokens?: number   // Anthropic cache creation, billed at 1.25× input
}

// ------------------------------------------------------------
// Price table cache: one query per minute across all requests
// ------------------------------------------------------------
const TTL_MS = 60_000
let cache: { at: number; rows: ModelPrice[] } | null = null

async function loadPrices(): Promise<ModelPrice[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.rows
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('model_prices')
    .select('provider, model, input_per_million, output_per_million, cached_input_per_million')
    .eq('is_active', true)
  const rows = (data ?? []).map(r => ({
    provider: r.provider,
    model: r.model,
    input_per_million: Number(r.input_per_million),
    output_per_million: Number(r.output_per_million),
    cached_input_per_million: r.cached_input_per_million === null ? null : Number(r.cached_input_per_million),
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
    .filter(r => r.model !== '*' && model.startsWith(r.model + '-'))
    .sort((a, b) => b.model.length - a.model.length)[0]
  if (prefix) return { ...prefix, status: 'alias', requested_model: model }

  const fallback = rows.find(r => r.model === '*')
  if (fallback) return { ...fallback, status: 'fallback', requested_model: model }

  return null
}

export function providerCost(price: ModelPrice, usage: TokenUsage): number {
  const cachedRate = price.cached_input_per_million ?? price.input_per_million
  const input = (usage.input_tokens / 1e6) * price.input_per_million
  const cached = ((usage.cached_input_tokens ?? 0) / 1e6) * cachedRate
  const cacheWrite = ((usage.cache_write_tokens ?? 0) / 1e6) * price.input_per_million * 1.25
  const output = (usage.output_tokens / 1e6) * price.output_per_million
  return input + cached + cacheWrite + output
}

export function userPrice(providerCostUsd: number): number {
  return providerCostUsd * marginMultiplier()
}

// Public view of the table with user prices applied
export async function listUserPrices() {
  const m = marginMultiplier()
  return (await loadPrices())
    .filter(r => r.model !== '*')
    .map(r => ({
      provider: r.provider,
      model: r.model,
      input_per_million: +(r.input_per_million * m).toFixed(4),
      output_per_million: +(r.output_per_million * m).toFixed(4),
      cached_input_per_million: r.cached_input_per_million === null ? null : +(r.cached_input_per_million * m).toFixed(4),
    }))
    .sort((a, b) => a.provider.localeCompare(b.provider) || a.model.localeCompare(b.model))
}
