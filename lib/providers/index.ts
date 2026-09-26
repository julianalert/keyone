import type { ProviderAdapter } from './types'
import { openai } from './openai'
import { anthropic } from './anthropic'
import { perplexity } from './perplexity'
import { dataforseo } from './dataforseo'
import { apify } from './apify'

export type { ProviderAdapter }

const registry: Record<string, ProviderAdapter> = {
  [openai.id]: openai,
  [anthropic.id]: anthropic,
  [perplexity.id]: perplexity,
  [dataforseo.id]: dataforseo,
  [apify.id]: apify,
}

export function getAdapter(provider: string): ProviderAdapter | null {
  return registry[provider] ?? null
}

export function listProviders(): string[] {
  return Object.keys(registry)
}
