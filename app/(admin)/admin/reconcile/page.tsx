import { createServiceClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { formatUSD } from '@/lib/utils'
import { openaiAdminConfigured, anthropicAdminConfigured } from '@/lib/reconcile/providers'
import { RunReconcile } from './RunReconcile'

export const dynamic = 'force-dynamic'

interface Row { provider: string; day: string; model: string; our_calls: number; our_provider_cost_usd: number | string; our_price_usd: number | string; actual_cost_usd: number | string | null; variance_usd: number | string | null; variance_pct: number | string | null; our_input_tokens: number; our_output_tokens: number; actual_input_tokens: number | null; actual_output_tokens: number | null; fetched_at: string | null }

// /admin/reconcile — estimate vs the provider's bill, last 30 days
export default async function ReconcilePage() {
  const supabase = createServiceClient()
  const since = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10)
  const { data } = await supabase.from('reconciliation_days').select('*').gte('day', since).order('day', { ascending: false })
  const rows = (data ?? []) as Row[]
  const totals = rows.filter(r => r.model === '*')
  const models = rows.filter(r => r.model !== '*')
  const n = (v: unknown) => Number(v ?? 0)

  const byProvider = ['openai', 'anthropic'].map(p => {
    const t = totals.filter(r => r.provider === p)
    const ours = t.reduce((s, r) => s + n(r.our_provider_cost_usd), 0)
    const actual = t.reduce((s, r) => s + n(r.actual_cost_usd), 0)
    const price = t.reduce((s, r) => s + n(r.our_price_usd), 0)
    const last = t.map(r => r.fetched_at).filter(Boolean).sort().pop() ?? null
    return { provider: p, days: t.length, ours, actual, price, variance: actual - ours, pct: ours > 0 ? ((actual - ours) / ours) * 100 : null, realizedMargin: price - actual, last,
      configured: p === 'openai' ? openaiAdminConfigured() : anthropicAdminConfigured() }
  })

  const worst = models
    .filter(r => r.actual_cost_usd !== null && (n(r.our_provider_cost_usd) > 0.01 || n(r.actual_cost_usd) > 0.01))
    .sort((a, b) => Math.abs(n(b.variance_usd)) - Math.abs(n(a.variance_usd)))
    .slice(0, 12)

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="section-label">Platform</p>
          <h1 className="serif text-4xl font-normal">Margin check</h1>
          <p className="text-sm text-ink-muted mt-1">What key.one estimated it would pay vs what the providers actually billed. Runs daily at 08:30 UTC for the last three days.</p>
        </div>
        <RunReconcile />
      </div>

      <div className="grid grid-cols-1 gap-4 mb-8 lg:grid-cols-2">
        {byProvider.map(p => (
          <Card key={p.provider} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-ink capitalize">{p.provider}</p>
              {!p.configured ? (
                <span className="text-2xs uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-700">No admin key</span>
              ) : p.pct === null ? (
                <span className="text-2xs uppercase tracking-wider px-2 py-0.5 rounded bg-border text-ink-muted">No data yet</span>
              ) : (
                <span className="text-2xs uppercase tracking-wider px-2 py-0.5 rounded" style={Math.abs(p.pct) <= 5 ? { background: '#EAF3DE', color: '#3B6D11' } : { background: '#FEF2F2', color: '#B91C1C' }}>
                  {p.pct > 0 ? '+' : ''}{p.pct.toFixed(1)}% vs estimate
                </span>
              )}
            </div>
            {!p.configured ? (
              <p className="text-xs text-ink-muted">Set {p.provider === 'openai' ? 'OPENAI_ADMIN_KEY (an OpenAI Admin API key; optionally OPENAI_PROJECT_ID)' : 'ANTHROPIC_ADMIN_KEY (an Anthropic Admin API key; optionally ANTHROPIC_WORKSPACE_ID)'} and run again.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-ink-subtle">Estimated cost</p><p className="text-ink">{formatUSD(p.ours, 4)}</p></div>
                <div><p className="text-xs text-ink-subtle">Actually billed</p><p className="text-ink">{formatUSD(p.actual, 4)}</p></div>
                <div><p className="text-xs text-ink-subtle">Charged to projects</p><p className="text-ink">{formatUSD(p.price, 4)}</p></div>
                <div><p className="text-xs text-ink-subtle">Realized gross margin</p><p className="text-green-dark font-medium">{formatUSD(p.realizedMargin, 4)} <span className="text-ink-subtle font-normal">({p.price > 0 ? `${((p.realizedMargin / p.price) * 100).toFixed(1)}%` : '—'})</span></p></div>
                <p className="col-span-2 text-2xs text-ink-subtle">{p.days} day{p.days === 1 ? '' : 's'} reconciled · last fetch {p.last ? new Date(p.last).toLocaleString('en-US', { timeZone: 'UTC' }) + ' UTC' : 'never'}</p>
              </div>
            )}
          </Card>
        ))}
      </div>

      <Card className="mb-6">
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '0.5px solid #e0ddd7' }}>
          <p className="text-sm font-medium text-ink">By day</p>
          <p className="text-xs text-ink-muted">Positive variance means the provider billed more than we estimated</p>
        </div>
        <div className="px-5 py-2 grid grid-cols-12 gap-3 text-2xs text-ink-subtle uppercase tracking-wider" style={{ borderBottom: '0.5px solid #e0ddd7' }}>
          <span className="col-span-2">Day</span><span className="col-span-2">Provider</span><span className="col-span-1 text-right">Calls</span>
          <span className="col-span-2 text-right">Estimated</span><span className="col-span-2 text-right">Billed</span><span className="col-span-3 text-right">Variance</span>
        </div>
        {totals.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-ink-muted">Nothing reconciled yet. Add the admin keys and click Run now.</div>
        ) : totals.slice(0, 40).map((r, i, arr) => (
          <div key={`${r.provider}-${r.day}`} className="px-5 py-2 grid grid-cols-12 gap-3 text-xs tabular-nums" style={i < arr.length - 1 ? { borderBottom: '0.5px solid #e0ddd7' } : undefined}>
            <span className="col-span-2 text-ink">{r.day}</span><span className="col-span-2 text-ink-muted">{r.provider}</span><span className="col-span-1 text-right text-ink-muted">{r.our_calls}</span>
            <span className="col-span-2 text-right text-ink">{formatUSD(n(r.our_provider_cost_usd), 4)}</span>
            <span className="col-span-2 text-right text-ink">{r.actual_cost_usd === null ? '—' : formatUSD(n(r.actual_cost_usd), 4)}</span>
            <span className="col-span-3 text-right" style={{ color: r.variance_pct === null ? '#888780' : Math.abs(n(r.variance_pct)) <= 5 ? '#3B6D11' : '#B91C1C' }}>
              {r.variance_usd === null ? '—' : `${n(r.variance_usd) >= 0 ? '+' : ''}${formatUSD(n(r.variance_usd), 4)}${r.variance_pct !== null ? ` (${n(r.variance_pct) >= 0 ? '+' : ''}${n(r.variance_pct).toFixed(1)}%)` : ''}`}
            </span>
          </div>
        ))}
      </Card>

      {worst.length > 0 && (
        <Card>
          <div className="px-5 py-3" style={{ borderBottom: '0.5px solid #e0ddd7' }}>
            <p className="text-sm font-medium text-ink">Largest per-model gaps</p>
            <p className="text-xs text-ink-muted">A model that&apos;s consistently off usually has a stale or missing price row.</p>
          </div>
          <div className="px-5 py-2 grid grid-cols-12 gap-3 text-2xs text-ink-subtle uppercase tracking-wider" style={{ borderBottom: '0.5px solid #e0ddd7' }}>
            <span className="col-span-2">Day</span><span className="col-span-4">Model</span><span className="col-span-2 text-right">Tokens ours / theirs</span>
            <span className="col-span-2 text-right">Est. / billed</span><span className="col-span-2 text-right">Variance</span>
          </div>
          {worst.map((r, i, arr) => (
            <div key={`${r.provider}-${r.day}-${r.model}`} className="px-5 py-2 grid grid-cols-12 gap-3 text-xs tabular-nums" style={i < arr.length - 1 ? { borderBottom: '0.5px solid #e0ddd7' } : undefined}>
              <span className="col-span-2 text-ink">{r.day}</span>
              <span className="col-span-4 font-mono text-ink truncate">{r.provider}/{r.model}</span>
              <span className="col-span-2 text-right text-ink-muted">{(r.our_input_tokens + r.our_output_tokens).toLocaleString()} / {r.actual_input_tokens === null ? '—' : ((r.actual_input_tokens ?? 0) + (r.actual_output_tokens ?? 0)).toLocaleString()}</span>
              <span className="col-span-2 text-right text-ink">{formatUSD(n(r.our_provider_cost_usd), 4)} / {formatUSD(n(r.actual_cost_usd), 4)}</span>
              <span className="col-span-2 text-right" style={{ color: Math.abs(n(r.variance_pct)) <= 5 ? '#3B6D11' : '#B91C1C' }}>{n(r.variance_usd) >= 0 ? '+' : ''}{formatUSD(n(r.variance_usd), 4)}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
