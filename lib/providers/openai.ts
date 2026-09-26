import type { ProviderAdapter } from './types'

export const openai: ProviderAdapter = {
  id: 'openai',

  buildUrl: (api, path) => (path ? `${new URL(api.base_url).origin}/${path}` : api.base_url),
  buildHeaders: (_api, incoming) => {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    }
    const beta = incoming?.get('openai-beta')
    if (beta) h['openai-beta'] = beta
    return h
  },

  wantsStream: body => body.stream === true,

  // Streams only report usage when asked; newer models take max_completion_tokens
  prepareBody: body => {
    let out = body
    if (out.stream === true) out = { ...out, stream_options: { ...(out.stream_options as object ?? {}), include_usage: true } }
    const model = typeof out.model === 'string' ? out.model : ''
    if (out.max_tokens !== undefined && out.max_completion_tokens === undefined && /^(gpt-[5-9]|gpt-\d{2}|o\d)/.test(model)) {
      const { max_tokens, ...rest } = out
      out = { ...rest, max_completion_tokens: max_tokens }
    }
    return out
  },

  usageFromJson: json => {
    const u = json.usage as {
      prompt_tokens?: number
      completion_tokens?: number
      input_tokens?: number
      output_tokens?: number
      prompt_tokens_details?: { cached_tokens?: number }
      input_tokens_details?: { cached_tokens?: number }
    } | undefined
    if (!u) return null
    const prompt = u.prompt_tokens ?? u.input_tokens ?? 0
    const cached = u.prompt_tokens_details?.cached_tokens ?? u.input_tokens_details?.cached_tokens ?? 0
    return {
      input_tokens: Math.max(0, prompt - cached),
      cached_input_tokens: cached,
      output_tokens: u.completion_tokens ?? u.output_tokens ?? 0,
    }
  },

  // Chat Completions: the last chunk carries usage. Responses API: response.completed.
  usageFromSse: events => {
    for (let i = events.length - 1; i >= 0; i--) {
      const e = events[i]
      if (e.usage) return openai.usageFromJson!(e)
      const resp = e.response as Record<string, unknown> | undefined
      if (resp?.usage) return openai.usageFromJson!(resp)
    }
    return null
  },
}
