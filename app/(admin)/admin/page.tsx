import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { parseRange } from '@/lib/reports'
import { STRIPE_FEE_PCT, STRIPE_FEE_FIXED_USD } from '@/lib/platform'
import { marginMultiplier } from '@/lib/billing/pricing'
import { Card } from '@/components/ui/Card'
import { formatUSD } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface CallRow { agency_id: string; cost_usd: number | string; provider_cost_usd: number | string; status: string; pricing_status: string | null }
interface TopupRow { agency_id: string; amount_usd: number | string; stripe_payment_intent_id: string | null }

// /admin — what key.one earns. Owner only.
export default async function AdminPage({ searchParams }: { searchParams?: Record<string, string> }) {
  const range = parseRange(new URLSearchParams(searchParams ?? {}))
  const supabase = createServiceClient()

  const [{ data: calls }, { data: topups }, { data: agencies }, { data: prices }] = await Promise.all([
    supabase.from('api_calls').select('agency_id, cost_usd, provider_cost_usd, status, pricing_status').gte('created_at', range.from).lt('created_at', range.to).limit(100000),
    supabase.from('wallet_transactions').select('agency_id, amount_usd, stripe_payment_intent_id').eq('type', 'topup').gte('created_at', range.from).lt('created_at', range.to),
    supabase.from('agencies').select('id, name, created_at'),
    supabase.from('model_prices').select('updated_at').order('updated_at', { ascending: false }).limit(1),
  ])

  const byAgency = new Map<string, { revenue: number; cost: number; calls: number; blocked: number; fallback: number; topups: number; topupCount: number; welcome: number }>()
  const get = (id: string) => byAgency.get(id) ?? byAgency.set(id, { revenue: 0, cost: 0, calls: 0, blocked: 0, fallback: 0, topups: 0, topupCount: 0, welcome: 0 }).get(id)!

  for (const c of (calls ?? []) as CallRow[]) {
    const a = get(c.agency_id)
    if (c.status === 'completed') { a.revenue += Number(c.cost_usd); a.cost += Number(c.provider_cost_usd); a.calls += 1 }
    if (c.status === 'blocked') a.blocked += 1
    if (c.pricing_status === 'fallback') a.fallback += 1
  }
  for (const t of (topups ?? []) as TopupRow[]) {
    const a = get(t.agency_id)
    if (t.stripe_payment_intent_id) { a.topups += Number(t.amount_usd); a.topupCount += 1 } else { a.welcome += Number(t.amount_usd) }
  }

  const rows = Array.from(byAgency.entries()).map(([id, v]) => ({
    id, name: agencies?.find(a => a.id === id)?.name ?? id.slice(0, 8), ...v,
    grossMargin: v.revenue - v.cost,
    stripeFees: v.topups * STRIPE_FEE_PCT + v.topupCount * STRIPE_FEE_FIXED_USD,
  })).sort((a, b) => b.revenue - a.revenue)

  const t = rows.reduce((s, r) => ({
    revenue: s.revenue + r.revenue, cost: s.cost + r.cost, calls: s.calls + r.calls, blocked: s.blocked + r.blocked, fallback: s.fallback + r.fallback,
    topups: s.topups + r.topups, topupCount: s.topupCount + r.topupCount, welcome: s.welcome + r.welcome, grossMargin: s.grossMargin + r.grossMargin, stripeFees: s.stripeFees + r.stripeFees,
  }), { revenue: 0, cost: 0, calls: 0, blocked: 0, fallback: 0, topups: 0, topupCount: 0, welcome: 0, grossMargin: 0, stripeFees: 0 })
  const netMargin = t.grossMargin - t.stripeFees
  const pct = (num: number, den: number) => (den > 0 ? `${((num / den) * 100).toFixed(1)}%` : '—')
  const priceAgeDays = prices?.[0]?.updated_at ? Math.floor((Date.now() - new Date(prices[0].updated_at).getTime()) / 86400_000) : null

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="section-label">Platform</p>
          <h1 className="serif text-4xl font-normal">What key.one earns</h1>
          <p className="text-sm text-ink-muted mt-1">{range.label} · margin setting {((marginMultiplier() - 1) * 100).toFixed(0)}% · provider cost is estimated from list prices, not yet reconciled with provider bills</p>
        </div>
        <div className="flex gap-1.5">
          <Link href="/admin?range=this_month" className="px-3 py-1.5 rounded text-xs border border-border text-ink-muted hover:text-ink" style={{ borderWidth: '0.5px' }}>This month</Link>
          <Link href="/admin?range=last_month" className="px-3 py-1.5 rounded text-xs border border-border text-ink-muted hover:text-ink" style={{ borderWidth: '0.5px' }}>Last month</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-4">
        <Metric label="Revenue (charged to projects)" value={formatUSD(t.revenue, 4)} sub={`${t.calls.toLocaleString()} calls`} />
        <Metric label="Provider cost (estimated)" value={formatUSD(t.cost, 4)} sub={t.fallback > 0 ? `${t.fallback} calls at fallback price` : 'no fallback-priced calls'} />
        <Metric label="Gross margin" value={formatUSD(t.grossMargin, 4)} sub={`${pct(t.grossMargin, t.revenue)} of revenue`} />
        <Metric label="Net margin after Stripe" value={formatUSD(netMargin, 4)} sub={`${pct(netMargin, t.revenue)} · fees ${formatUSD(t.stripeFees, 2)} on ${t.topupCount} top-up${t.topupCount === 1 ? '' : 's'}`} accent />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4">
        <Metric label="Card top-ups" value={formatUSD(t.topups, 2)} sub="Cash in" />
        <Metric label="Welcome credit given" value={formatUSD(t.welcome, 2)} sub="Acquisition cost" />
        <Metric label="Blocked calls" value={t.blocked.toLocaleString()} sub="Refused by controls" />
        <Metric label="Price table age" value={priceAgeDays === null ? '—' : `${priceAgeDays}d`} sub={priceAgeDays !== null && priceAgeDays > 30 ? 'Verify against provider price pages' : 'Last row update'} />
      </div>

      <Card>
        <div className="px-5 py-3 grid grid-cols-12 gap-3 text-2xs text-ink-subtle uppercase tracking-wider" style={{ borderBottom: '0.5px solid #e0ddd7' }}>
          <span className="col-span-3">Agency</span>
          <span className="col-span-1 text-right">Calls</span>
          <span className="col-span-2 text-right">Revenue</span>
          <span className="col-span-2 text-right">Provider cost</span>
          <span className="col-span-2 text-right">Gross margin</span>
          <span className="col-span-2 text-right">Top-ups</span>
        </div>
        {rows.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-ink-muted">No activity in this range.</div>
        ) : rows.map((r, i) => (
          <div key={r.id} className="px-5 py-3 grid grid-cols-12 gap-3 text-sm items-center" style={i < rows.length - 1 ? { borderBottom: '0.5px solid #e0ddd7' } : undefined}>
            <span className="col-span-3 text-ink truncate">{r.name}{r.fallback > 0 && <span className="ml-2 text-2xs text-amber-700">{r.fallback} fallback</span>}</span>
            <span className="col-span-1 text-right text-ink-muted text-xs tabular-nums">{r.calls}</span>
            <span className="col-span-2 text-right text-ink text-xs tabular-nums">{formatUSD(r.revenue, 4)}</span>
            <span className="col-span-2 text-right text-ink-muted text-xs tabular-nums">{formatUSD(r.cost, 4)}</span>
            <span className="col-span-2 text-right text-green-dark text-xs tabular-nums">{formatUSD(r.grossMargin, 4)} <span className="text-ink-subtle">({pct(r.grossMargin, r.revenue)})</span></span>
            <span className="col-span-2 text-right text-ink-muted text-xs tabular-nums">{formatUSD(r.topups, 2)}{r.welcome > 0 ? ` +${formatUSD(r.welcome, 0)} gift` : ''}</span>
          </div>
        ))}
      </Card>

      <p className="mt-6 text-xs text-ink-subtle">
        Provider cost here is tokens × the list prices in the price table. Reconciliation against actual OpenAI and Anthropic bills is the next step; until then, treat gross margin as an upper bound.
      </p>
    </div>
  )
}

function Metric({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <Card className="p-5">
      <p className="text-xs text-ink-subtle mb-1">{label}</p>
      <p className={`text-2xl font-normal serif ${accent ? 'text-green-dark' : 'text-ink'}`}>{value}</p>
      <p className="text-xs text-ink-muted mt-1">{sub}</p>
    </Card>
  )
}
