import type { ProviderAdapter, UsageContext } from './types'
import type { TokenUsage } from '@/lib/billing/pricing'

interface AnthropicUsage {
  input_tokens?: number
  output_tokens?: number
  cache_read_input_tokens?: number
  cache_creation_input_tokens?: number
  cache_creation?: { ephemeral_5m_input_tokens?: number; ephemeral_1h_input_tokens?: number }
  server_tool_use?: { web_search_requests?: number; web_fetch_requests?: number }
}

function fromUsage(u: AnthropicUsage | undefined, prev?: TokenUsage): TokenUsage | null {
  if (!u) return prev ?? null
  const usage: TokenUsage = {
    input_tokens: u.input_tokens ?? prev?.input_tokens ?? 0,
    output_tokens: u.output_tokens ?? prev?.output_tokens ?? 0,
    cached_input_tokens: u.cache_read_input_tokens ?? prev?.cached_input_tokens ?? 0,
  }
  // 1-hour cache writes cost 2× input, 5-minute ones 1.25×; the split arrives in cache_creation
  const oneHour = u.cache_creation?.ephemeral_1h_input_tokens ?? prev?.cache_write_1h_tokens ?? 0
  const total = u.cache_creation_input_tokens ?? ((prev?.cache_write_tokens ?? 0) + (prev?.cache_write_1h_tokens ?? 0))
  const fiveMin = u.cache_creation?.ephemeral_5m_input_tokens ?? Math.max(0, total - oneHour)
  if (fiveMin) usage.cache_write_tokens = fiveMin
  if (oneHour) usage.cache_write_1h_tokens = oneHour
  const searches = u.server_tool_use?.web_search_requests ?? prev?.tool_calls?.web_search
  if (searches) usage.tool_calls = { web_search: searches }
  return usage
}

// Fast mode (speed: "fast") doubles the price on the models that support it
function withTier(usage: TokenUsage | null, ctx: UsageContext): TokenUsage | null {
  if (!usage) return usage
  const model = typeof ctx.body.model === 'string' ? ctx.body.model : ''
  if (ctx.body.speed === 'fast' && /claude-opus-(5|4-8)/.test(model)) return { ...usage, multiplier: 2 }
  return usage
}

export const anthropic: ProviderAdapter = {
  id: 'anthropic',
  configured: () => !!process.env.ANTHROPIC_API_KEY,

  // SDK-style paths: some clients send "v1/messages", others just "messages"
  // (the Vercel AI SDK's Anthropic provider, for one). Both must reach /v1/….
  buildUrl: (api, path) => (path ? `${new URL(api.base_url).origin}/${path.startsWith('v1/') ? path : `v1/${path}`}` : api.base_url),
  buildHeaders: (_api, incoming) => {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
      'anthropic-version': incoming?.get('anthropic-version') ?? '2023-06-01',
    }
    const beta = incoming?.get('anthropic-beta')
    if (beta) h['anthropic-beta'] = beta
    return h
  },

  wantsStream: body => body.stream === true,

  usageFromJson: (json, ctx) => withTier(fromUsage(json.usage as AnthropicUsage | undefined), ctx),

  // message_start carries input + cache tokens; message_delta carries the
  // cumulative output count (and server tool use). Merge in order.
  usageFromSse: (events, ctx) => {
    let usage: TokenUsage | undefined
    for (const e of events) {
      if (e.type === 'message_start') {
        const msg = e.message as { usage?: AnthropicUsage } | undefined
        usage = fromUsage(msg?.usage, usage) ?? usage
      } else if (e.type === 'message_delta') {
        usage = fromUsage(e.usage as AnthropicUsage | undefined, usage) ?? usage
      }
    }
    return withTier(usage ?? null, ctx)
  },
}
