import { resolveModelPrice, listUserPrices } from '@/lib/billing/pricing'

export const MODEL_SHORTCUTS = ['cheapest', 'balanced', 'best'] as const
export type ModelShortcut = (typeof MODEL_SHORTCUTS)[number]

export function isModelShortcut(model: unknown): model is ModelShortcut {
  return typeof model === 'string' && (MODEL_SHORTCUTS as readonly string[]).includes(model)
}

// Specialty and legacy models never win a shortcut
const EXCLUDE = /-pro$|codex|chat-latest|cyber|^o1|^gpt-3\.5|^gpt-4$|^gpt-4-turbo|claude-opus-4-[01]$|claude-sonnet-4-0$/

// Resolve "cheapest" / "balanced" / "best" to a concrete model id for a provider,
// using the price table: cheapest = lowest output price, best = highest, balanced = median.
export async function resolveModelShortcut(provider: string, shortcut: ModelShortcut): Promise<string | null> {
  const rows = (await listUserPrices()).filter(r => r.provider === provider && !EXCLUDE.test(r.model))
  if (rows.length === 0) return null
  const sorted = rows.slice().sort((a, b) => a.output_per_million - b.output_per_million || a.input_per_million - b.input_per_million)
  if (shortcut === 'cheapest') return sorted[0].model
  if (shortcut === 'best') return sorted[sorted.length - 1].model
  return sorted[Math.floor(sorted.length / 2)].model
}

export { resolveModelPrice }
