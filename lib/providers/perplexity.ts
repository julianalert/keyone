import type { ProviderAdapter } from './types'
import { openai } from './openai'

// OpenAI-compatible chat API; priced per call in the catalog
export const perplexity: ProviderAdapter = {
  id: 'perplexity',
  // SDK-style paths: some clients send "v1/messages", others just "messages"
  // (the Vercel AI SDK's Anthropic provider, for one). Both must reach /v1/….
  buildUrl: (api, path) => (path ? `${new URL(api.base_url).origin}/${path.startsWith('v1/') ? path : `v1/${path}`}` : api.base_url),
  buildHeaders: () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
  }),
  wantsStream: body => body.stream === true,
  usageFromJson: openai.usageFromJson,
  usageFromSse: openai.usageFromSse,
}
