import Anthropic from '@anthropic-ai/sdk'
import type { Finding } from './analyze'

export const DIGEST_MODEL = 'claude-sonnet-5'

function anthropicConfigured(): boolean {
  const k = process.env.ANTHROPIC_API_KEY ?? ''
  return k.startsWith('sk-ant-') && k !== 'sk-ant-...'
}

// Plain deterministic digest, used when there's no model key or the call fails
export function deterministicDigest(agencyName: string, findings: Finding[]): string {
  if (findings.length === 0) return `Nothing needs attention at ${agencyName}. Spend is within budgets and no anomalies were found.`
  const lines = findings.map((f, i) => `${i + 1}. [${f.severity.toUpperCase()}] ${f.title}. ${f.action ? `Proposal: ${f.action.expected_effect}` : ''}`)
  return `${findings.length} thing${findings.length === 1 ? '' : 's'} need attention at ${agencyName}:\n${lines.join('\n')}`
}

// Claude writes the digest from the computed findings. It never invents
// numbers: everything it can say is in the findings it's given.
export async function writeDigest(agencyName: string, findings: Finding[]): Promise<{ text: string; model: string | null; cost_usd: number }> {
  if (!anthropicConfigured() || findings.length === 0) {
    return { text: deterministicDigest(agencyName, findings), model: null, cost_usd: 0 }
  }

  const client = new Anthropic()
  const payload = findings.map((f, i) => ({
    n: i + 1, severity: f.severity, kind: f.kind, scope: f.scope_label, title: f.title, detail: f.detail, metrics: f.metrics,
    proposal: f.action?.expected_effect ?? null,
  }))

  try {
    const response = await client.messages.create({
      model: DIGEST_MODEL,
      max_tokens: 1200,
      system:
        'You are the spend controller for a marketing agency that runs AI projects for clients through key.one. ' +
        'You receive findings computed by code, each with exact numbers. Write a short daily digest for the agency owner: ' +
        'lead with the one thing that matters most, group related findings, keep every number exactly as given, never add numbers or findings of your own, ' +
        'and end with what to decide today. Plain prose, no headers, no markdown, at most 180 words. Refer to findings by their number in brackets like [2] so the owner can act on them.',
      messages: [{ role: 'user', content: `Agency: ${agencyName}\nFindings (JSON):\n${JSON.stringify(payload, null, 2)}` }],
    })
    const text = response.content.filter(b => b.type === 'text').map(b => (b as { text: string }).text).join('\n').trim()
    // Sonnet 5 list price: $2 in / $10 out per 1M
    const cost = (response.usage.input_tokens / 1e6) * 2 + (response.usage.output_tokens / 1e6) * 10
    return { text: text || deterministicDigest(agencyName, findings), model: DIGEST_MODEL, cost_usd: cost }
  } catch (err) {
    console.error('[controller] digest model call failed, using deterministic digest:', err)
    return { text: deterministicDigest(agencyName, findings), model: null, cost_usd: 0 }
  }
}
