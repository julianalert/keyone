import type { ProviderAdapter } from './types'
import type { TokenUsage } from '@/lib/billing/pricing'

interface AnthropicUsage {
  input_tokens?: number
  output_tokens?: number
  cache_read_input_tokens?: number
  cache_creation_input_tokens?: number
}

function fromUsage(u: AnthropicUsage | undefined, prev?: TokenUsage): TokenUsage | null {
  if (!u) return prev ?? null
  return {
    input_tokens: u.input_tokens ?? prev?.input_tokens ?? 0,
    output_tokens: u.output_tokens ?? prev?.output_tokens ?? 0,
    cached_input_tokens: u.cache_read_input_tokens ?? prev?.cached_input_tokens ?? 0,
    cache_write_tokens: u.cache_creation_input_tokens ?? prev?.cache_write_tokens ?? 0,
  }
}

export const anthropic: ProviderAdapter = {
  id: 'anthropic',

  buildUrl: (api, path) => (path ? `${new URL(api.base_url).origin}/${path}` : api.base_url),
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

  usageFromJson: json => fromUsage(json.usage as AnthropicUsage | undefined),

  // message_start carries input + cache tokens; message_delta carries the
  // cumulative output count. Merge in order.
  usageFromSse: events => {
    let usage: TokenUsage | undefined
    for (const e of events) {
      if (e.type === 'message_start') {
        const msg = e.message as { usage?: AnthropicUsage } | undefined
        usage = fromUsage(msg?.usage, usage) ?? usage
      } else if (e.type === 'message_delta') {
        usage = fromUsage(e.usage as AnthropicUsage | undefined, usage) ?? usage
      }
    }
    return usage ?? null
  },
}
