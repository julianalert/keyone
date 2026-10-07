import { endpointOf, type ProviderAdapter, type UsageContext } from './types'
import type { TokenUsage } from '@/lib/billing/pricing'

// Perplexity: the Agent API (POST /v1/agent, OpenAI-Responses-shaped) and the
// Search API (POST /search). Every response carries usage.cost.total_cost in
// USD, so billing uses Perplexity's own number; the price table only drives
// estimates, shortcuts and the catalog. The legacy chat-completions endpoint
// (retired 2026-09-27) is still passed through for stragglers.
const ORIGIN = 'https://api.perplexity.ai'

function upstreamPath(path: string): string {
  const p = path.replace(/^\/+/, '').replace(/^v1\//, '')
  if (p === 'agent' || p === 'responses') return 'v1/agent'
  return p                                   // search, chat/completions, …
}

const isSearch = (ctx: UsageContext) => endpointOf(ctx.path) === 'search'

// POST endpoints we can price ('' is the bare slug → /v1/agent)
const ENDPOINTS = ['', 'agent', 'responses', 'search', 'chat/completions']

interface PerplexityUsage {
  input_tokens?: number
  output_tokens?: number
  prompt_tokens?: number
  completion_tokens?: number
  input_tokens_details?: { cache_read_input_tokens?: number; cache_creation_input_tokens?: number }
  tool_calls_details?: Record<string, number>
  cost?: { total_cost?: number }
}

function fromUsage(json: Record<string, unknown>): TokenUsage | null {
  const u = json.usage as PerplexityUsage | undefined
  if (!u) return null
  const cached = u.input_tokens_details?.cache_read_input_tokens ?? 0
  const usage: TokenUsage = {
    input_tokens: Math.max(0, (u.input_tokens ?? u.prompt_tokens ?? 0) - cached),
    cached_input_tokens: cached,
    output_tokens: u.output_tokens ?? u.completion_tokens ?? 0,
  }
  if (u.tool_calls_details && Object.keys(u.tool_calls_details).length) usage.tool_calls = u.tool_calls_details
  if (typeof u.cost?.total_cost === 'number') usage.reported_cost_usd = u.cost.total_cost
  return usage
}

export const perplexity: ProviderAdapter = {
  id: 'perplexity',
  configured: () => !!process.env.PERPLEXITY_API_KEY && !/^pplx-x{3,}|^pplx-your/i.test(process.env.PERPLEXITY_API_KEY),

  buildUrl: (api, path) => (path ? `${ORIGIN}/${upstreamPath(path)}` : api.base_url),
  buildHeaders: () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
  }),

  endpoint: path => (ENDPOINTS.includes(endpointOf(path)) ? 'metered' : null),

  wantsStream: body => body.stream === true,

  // The Search API has no model; it bills per request, fast searches cheaper
  modelFor: ctx => (isSearch(ctx) ? (ctx.body.search_type === 'fast' ? 'search:fast' : 'search') : null),

  usageFromJson: json => fromUsage(json),

  // Agent API: response.completed carries the final response with usage + cost.
  // Legacy chat completions: the last chunk carries usage.
  usageFromSse: events => {
    for (let i = events.length - 1; i >= 0; i--) {
      const e = events[i]
      const resp = e.response as Record<string, unknown> | undefined
      if (e.type === 'response.completed' && resp?.usage) return fromUsage(resp)
      if (e.usage) return fromUsage(e)
    }
    return null
  },

  // Search responses carry no usage: one unit per query
  usageFromRequest: ctx => {
    if (!isSearch(ctx)) return null
    const q = ctx.body.query
    return { input_tokens: 0, output_tokens: 0, units: Array.isArray(q) ? Math.max(1, q.length) : 1 }
  },
}
