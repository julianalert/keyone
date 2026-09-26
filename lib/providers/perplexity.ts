import type { ProviderAdapter } from './types'
import { openai } from './openai'

// OpenAI-compatible chat API; priced per call in the catalog
export const perplexity: ProviderAdapter = {
  id: 'perplexity',
  buildUrl: (api, path) => (path ? `${new URL(api.base_url).origin}/${path}` : api.base_url),
  buildHeaders: () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
  }),
  wantsStream: body => body.stream === true,
  usageFromJson: openai.usageFromJson,
  usageFromSse: openai.usageFromSse,
}
