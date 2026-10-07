import { endpointOf, type EndpointBilling, type ProviderAdapter, type UsageContext } from './types'
import type { TokenUsage } from '@/lib/billing/pricing'
import { imageFactor } from '@/lib/billing/calculate-cost'

// POST endpoints we can price
const ENDPOINTS: Record<string, EndpointBilling> = {
  '': 'metered',                      // bare slug → /v1/chat/completions
  'chat/completions': 'metered',
  'responses': 'metered',
  'embeddings': 'metered',
  'images/generations': 'metered',
  'images/edits': 'metered',
  'audio/speech': 'metered',
  'audio/transcriptions': 'metered',
  'moderations': 'free',
}

interface OpenAIUsage {
  // Chat Completions / embeddings
  prompt_tokens?: number
  completion_tokens?: number
  prompt_tokens_details?: { cached_tokens?: number; audio_tokens?: number }
  completion_tokens_details?: { audio_tokens?: number; reasoning_tokens?: number }
  // Responses API / image generation
  input_tokens?: number
  output_tokens?: number
  input_tokens_details?: { cached_tokens?: number; text_tokens?: number; image_tokens?: number }
  output_tokens_details?: { text_tokens?: number; image_tokens?: number }
  // Transcription
  type?: 'duration' | 'tokens'
  seconds?: number
  input_token_details?: { text_tokens?: number; audio_tokens?: number }
}

// Hosted tools show up as output items on the Responses API
function toolCalls(json: Record<string, unknown>): Record<string, number> | undefined {
  const output = json.output
  if (!Array.isArray(output)) return undefined
  const counts: Record<string, number> = {}
  for (const item of output as Array<{ type?: string }>) {
    if (item?.type === 'web_search_call' || item?.type === 'image_web_search_call') counts.web_search = (counts.web_search ?? 0) + 1
    else if (item?.type === 'file_search_call') counts.file_search = (counts.file_search ?? 0) + 1
  }
  return Object.keys(counts).length ? counts : undefined
}

function fromUsage(json: Record<string, unknown>): TokenUsage | null {
  const u = json.usage as OpenAIUsage | undefined
  if (!u) return null

  // Transcription (whisper-1 / gpt-transcribe report duration; the gpt-4o family reports tokens)
  if (u.type === 'duration') return { input_tokens: 0, output_tokens: 0, minutes: (u.seconds ?? 0) / 60 }
  if (u.type === 'tokens') {
    const d = u.input_token_details
    return {
      input_tokens: d?.text_tokens ?? 0,
      output_tokens: u.output_tokens ?? 0,
      audio_input_tokens: d?.audio_tokens ?? (u.input_tokens ?? 0),
    }
  }

  // Image generation: input_tokens_details has image_tokens (Responses has cached_tokens instead)
  const inD = u.input_tokens_details
  if (inD && typeof inD.image_tokens === 'number' && typeof inD.text_tokens === 'number') {
    const outD = u.output_tokens_details
    const out = u.output_tokens ?? 0
    return {
      input_tokens: inD.text_tokens,
      output_tokens: outD?.text_tokens ?? 0,
      image_input_tokens: inD.image_tokens,
      image_output_tokens: outD?.image_tokens ?? out - (outD?.text_tokens ?? 0),
    }
  }

  // Chat Completions, Responses, embeddings, audio chat
  const prompt = u.prompt_tokens ?? u.input_tokens ?? 0
  const cached = u.prompt_tokens_details?.cached_tokens ?? inD?.cached_tokens ?? 0
  const audioIn = u.prompt_tokens_details?.audio_tokens ?? 0
  const audioOut = u.completion_tokens_details?.audio_tokens ?? 0
  const output = u.completion_tokens ?? u.output_tokens ?? 0
  const usage: TokenUsage = {
    input_tokens: Math.max(0, prompt - cached - audioIn),
    cached_input_tokens: cached,
    output_tokens: Math.max(0, output - audioOut),
  }
  if (audioIn) usage.audio_input_tokens = audioIn
  if (audioOut) usage.audio_output_tokens = audioOut
  const tools = toolCalls(json)
  if (tools) usage.tool_calls = tools
  return usage
}

export const openai: ProviderAdapter = {
  id: 'openai',
  configured: () => !!process.env.OPENAI_API_KEY,

  // SDK-style paths: some clients send "v1/messages", others just "messages"
  // (the Vercel AI SDK's Anthropic provider, for one). Both must reach /v1/….
  buildUrl: (api, path) => (path ? `${new URL(api.base_url).origin}/${path.startsWith('v1/') ? path : `v1/${path}`}` : api.base_url),
  buildHeaders: (_api, incoming) => {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    }
    const beta = incoming?.get('openai-beta')
    if (beta) h['openai-beta'] = beta
    return h
  },

  // A background response returns before it has any usage and is collected
  // later by id, so there is nothing to bill it from.
  endpoint: (path, body) => {
    const p = endpointOf(path)
    if (p === 'responses' && body.background === true) return null
    return ENDPOINTS[p] ?? null
  },

  wantsStream: body => body.stream === true,

  // Two OpenAI request shapes need a tweak:
  //  - Chat Completions (body.messages): streams only report usage when asked for
  //    via stream_options, and newer models want max_completion_tokens.
  //  - Everything else (Responses API, images, embeddings, audio) is passed
  //    through untouched; usage arrives in the response as-is.
  prepareBody: body => {
    const isChatCompletions = Array.isArray(body.messages)
    if (!isChatCompletions) return body
    let out = body
    if (out.stream === true) out = { ...out, stream_options: { ...(out.stream_options as object ?? {}), include_usage: true } }
    const model = typeof out.model === 'string' ? out.model : ''
    if (out.max_tokens !== undefined && out.max_completion_tokens === undefined && /^(gpt-[5-9]|gpt-\d{2}|o\d)/.test(model)) {
      const { max_tokens, ...rest } = out
      out = { ...rest, max_completion_tokens: max_tokens }
    }
    return out
  },

  usageFromJson: json => fromUsage(json),

  // Chat Completions: the last chunk carries usage. Responses API: response.completed.
  // Image generation: image_generation.completed.
  usageFromSse: events => {
    for (let i = events.length - 1; i >= 0; i--) {
      const e = events[i]
      if (e.usage) return fromUsage(e)
      const resp = e.response as Record<string, unknown> | undefined
      if (resp?.usage) return fromUsage(resp)
    }
    return null
  },

  // Responses without usage: text-to-speech (audio bytes) is billed per input
  // character, DALL·E per image.
  usageFromRequest: ({ path, body }: UsageContext) => {
    const p = path ?? ''
    if (p.includes('audio/speech')) {
      const input = typeof body.input === 'string' ? body.input : ''
      return { input_tokens: 0, output_tokens: 0, characters: input.length }
    }
    const model = typeof body.model === 'string' ? body.model : ''
    if (p.includes('images/') && model.startsWith('dall-e')) {
      const n = typeof body.n === 'number' && body.n > 0 ? body.n : 1
      return { input_tokens: 0, output_tokens: 0, units: n * imageFactor(model, body) }
    }
    return null
  },
}
