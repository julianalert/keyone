import type { SupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { fetchOpenAIActuals, fetchAnthropicActuals, openaiAdminConfigured, anthropicAdminConfigured, type ActualRow } from './providers'
import { fromEmail, appUrl } from '@/lib/config'

export interface ReconcileSummary {
  from: string; to: string
  providers: { provider: string; status: 'ok' | 'skipped' | 'error'; detail?: string; days: number; ours_usd: number; actual_usd: number; variance_usd: number; variance_pct: number | null }[]
}

const ALERT_PCT = () => Number(process.env.RECONCILE_ALERT_PCT ?? 5)

// Reconcile [from, to] (UTC dates, inclusive). Default: the last 3 days,
// so late-arriving provider data is picked up on the next run.
export async function runReconciliation(supabase: SupabaseClient, days = 3, origin = ''): Promise<ReconcileSummary> {
  const to = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()))   // today 00:00 UTC
  const from = new Date(to.getTime() - (days - 1) * 86400_000)
  const toExclusive = new Date(to.getTime() + 86400_000)
  const fromDate = from.toISOString().slice(0, 10), toDate = to.toISOString().slice(0, 10)

  // Our side
  const { data: ours, error } = await supabase.rpc('reconcile_our_side', { p_from: fromDate, p_to: toDate })
  if (error) throw new Error(error.message)
  const ourRows = (ours ?? []) as { provider: string; day: string; model: string; calls: number; input_tokens: number; output_tokens: number; provider_cost_usd: number; price_usd: number }[]

  const summary: ReconcileSummary = { from: fromDate, to: toDate, providers: [] }

  for (const provider of ['openai', 'anthropic'] as const) {
    const configured = provider === 'openai' ? openaiAdminConfigured() : anthropicAdminConfigured()
    const mine = ourRows.filter(r => r.provider === provider)
    if (!configured) {
      summary.providers.push({ provider, status: 'skipped', detail: `${provider === 'openai' ? 'OPENAI_ADMIN_KEY' : 'ANTHROPIC_ADMIN_KEY'} not set`, days: 0, ours_usd: sum(mine, 'provider_cost_usd'), actual_usd: 0, variance_usd: 0, variance_pct: null })
      continue
    }

    let actual: ActualRow[]
    try {
      actual = provider === 'openai' ? await fetchOpenAIActuals(from, toExclusive) : await fetchAnthropicActuals(from, toExclusive)
    } catch (err) {
      summary.providers.push({ provider, status: 'error', detail: err instanceof Error ? err.message : String(err), days: 0, ours_usd: sum(mine, 'provider_cost_usd'), actual_usd: 0, variance_usd: 0, variance_pct: null })
      continue
    }

    // Merge per day × model, then per day total
    const keys = new Set<string>([...mine.map(r => `${r.day}|${r.model}`), ...actual.map(r => `${r.day}|${r.model}`)])
    const upserts: Record<string, unknown>[] = []
    const dayTotals = new Map<string, { ours: number; actual: number; price: number; calls: number; oi: number; oo: number; ai: number; ao: number }>()
    for (const k of Array.from(keys)) {
      const [day, model] = k.split('|')
      const o = mine.find(r => r.day === day && r.model === model)
      const a = actual.find(r => r.day === day && r.model === model)
      const oursUsd = Number(o?.provider_cost_usd ?? 0), actualUsd = Number(a?.cost_usd ?? 0)
      upserts.push(row(provider, day, model, o, a, oursUsd, actualUsd))
      const t = dayTotals.get(day) ?? { ours: 0, actual: 0, price: 0, calls: 0, oi: 0, oo: 0, ai: 0, ao: 0 }
      t.ours += oursUsd; t.actual += actualUsd; t.price += Number(o?.price_usd ?? 0); t.calls += Number(o?.calls ?? 0)
      t.oi += Number(o?.input_tokens ?? 0); t.oo += Number(o?.output_tokens ?? 0); t.ai += a?.input_tokens ?? 0; t.ao += a?.output_tokens ?? 0
      dayTotals.set(day, t)
    }
    for (const [day, t] of Array.from(dayTotals.entries())) {
      upserts.push(row(provider, day, '*', { calls: t.calls, input_tokens: t.oi, output_tokens: t.oo, provider_cost_usd: t.ours, price_usd: t.price }, { input_tokens: t.ai, output_tokens: t.ao }, t.ours, t.actual))
    }
    if (upserts.length) {
      const { error: upErr } = await supabase.from('reconciliation_days').upsert(upserts, { onConflict: 'provider,day,model' })
      if (upErr) throw new Error(upErr.message)
    }

    const oursTotal = Array.from(dayTotals.values()).reduce((s, t) => s + t.ours, 0)
    const actualTotal = Array.from(dayTotals.values()).reduce((s, t) => s + t.actual, 0)
    const variance = actualTotal - oursTotal
    const pct = oursTotal > 0 ? (variance / oursTotal) * 100 : null
    summary.providers.push({ provider, status: 'ok', days: dayTotals.size, ours_usd: oursTotal, actual_usd: actualTotal, variance_usd: variance, variance_pct: pct })

    if (pct !== null && Math.abs(pct) > ALERT_PCT() && oursTotal > 1) {
      await notifyPlatform(
        `key.one margin check: ${provider} actual cost is ${pct > 0 ? '+' : ''}${pct.toFixed(1)}% vs estimate`,
        `Between ${fromDate} and ${toDate}, ${provider} billed $${actualTotal.toFixed(4)} where key.one estimated $${oursTotal.toFixed(4)} (variance $${variance.toFixed(4)}). ` +
        (pct > 0 ? 'Projects are being under-charged; check the price table for stale rows.' : 'Projects are being over-charged relative to the provider bill; check for discounts or tier differences.') +
        `\n\n${appUrl(origin)}/admin/reconcile`
      )
    }
  }
  return summary
}

function sum<T>(rows: T[], k: keyof T) { return rows.reduce((s, r) => s + Number(r[k] ?? 0), 0) }

function row(provider: string, day: string, model: string, o: { calls?: number; input_tokens?: number; output_tokens?: number; provider_cost_usd?: number; price_usd?: number } | undefined, a: { input_tokens?: number; output_tokens?: number } | undefined, oursUsd: number, actualUsd: number) {
  const variance = actualUsd - oursUsd
  return {
    provider, day, model,
    our_calls: Number(o?.calls ?? 0), our_input_tokens: Number(o?.input_tokens ?? 0), our_output_tokens: Number(o?.output_tokens ?? 0),
    our_provider_cost_usd: oursUsd, our_price_usd: Number(o?.price_usd ?? 0),
    actual_cost_usd: actualUsd, actual_input_tokens: a?.input_tokens ?? null, actual_output_tokens: a?.output_tokens ?? null,
    variance_usd: variance, variance_pct: oursUsd > 0 ? (variance / oursUsd) * 100 : null,
    fetched_at: new Date().toISOString(),
  }
}

// Platform-level email to the owners. No agency involved.
async function notifyPlatform(subject: string, body: string) {
  const to = (process.env.PLATFORM_ADMIN_EMAILS ?? '').split(',').map(s => s.trim()).filter(Boolean)
  const key = process.env.RESEND_API_KEY ?? ''
  if (!to.length || !key.startsWith('re_') || key === 're_...') return
  try {
    await new Resend(key).emails.send({ from: fromEmail('alerts'), to, subject, text: body })
  } catch (err) {
    console.error('[reconcile] platform email failed:', err)
  }
}
