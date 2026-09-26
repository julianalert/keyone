'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { RangePicker, rangeQuery, type RangeState } from '@/components/reports/RangePicker'
import { BucketTable } from '@/components/reports/BucketTable'
import { formatUSD } from '@/lib/utils'

interface ProjectRow { project_id: string; project_name: string; calls: number; blocked: number; provider_cost_usd: number; price_usd: number; rebill_usd: number }
interface ClientRow { client_id: string; client_name: string; rebill_markup_pct: number; calls: number; blocked: number; provider_cost_usd: number; price_usd: number; rebill_usd: number; projects: ProjectRow[] }
interface Report { range: { label: string }; totals: { calls: number; blocked: number; provider_cost_usd: number; price_usd: number; rebill_usd: number; margin_usd: number }; clients: ClientRow[] }

export default function ReportsPage() {
  const [range, setRange] = useState<RangeState>({ range: 'this_month', from: '', to: '' })
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/reports/agency?${rangeQuery(range)}`)
    setReport(res.ok ? await res.json() : null)
    setLoading(false)
  }, [range])

  useEffect(() => { load() }, [load])

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="section-label">Reports</p>
          <h1 className="serif text-4xl font-normal">Spend by client</h1>
          {report && <p className="text-sm text-ink-muted mt-1">{report.range.label}</p>}
        </div>
        <div className="flex items-center gap-3">
          <RangePicker value={range} onChange={setRange} />
          <a href={`/api/reports/agency/export?${rangeQuery(range)}`} className="btn-primary text-xs px-4 py-2 rounded">Export CSV</a>
        </div>
      </div>

      {loading || !report ? (
        <div className="text-sm text-ink-muted">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-4">
            <Metric label="Provider cost" value={formatUSD(report.totals.provider_cost_usd, 4)} sub="What key.one paid" />
            <Metric label="Charged to projects" value={formatUSD(report.totals.price_usd, 4)} sub={`Margin ${formatUSD(report.totals.margin_usd, 4)}`} />
            <Metric label="Rebill to clients" value={formatUSD(report.totals.rebill_usd, 4)} sub="With each client's markup" accent />
            <Metric label="Calls" value={report.totals.calls.toLocaleString()} sub={report.totals.blocked > 0 ? `${report.totals.blocked} blocked` : 'None blocked'} />
          </div>

          {report.clients.length === 0 ? (
            <Card className="p-10 text-center text-sm text-ink-muted">No spend in this range.</Card>
          ) : report.clients.map(c => (
            <Card key={c.client_id} className="mb-4">
              <div className="px-5 py-4 flex items-center justify-between gap-4" style={{ borderBottom: '0.5px solid #e0ddd7' }}>
                <div>
                  <Link href={`/dashboard/clients/${c.client_id}`} className="text-sm font-medium text-ink hover:underline underline-offset-2">{c.client_name}</Link>
                  <p className="text-xs text-ink-muted">{c.projects.length} project{c.projects.length === 1 ? '' : 's'} · markup {c.rebill_markup_pct}%</p>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-right"><p className="text-xs text-ink-subtle">Price</p><p className="text-ink">{formatUSD(c.price_usd, 4)}</p></div>
                  <div className="text-right"><p className="text-xs text-ink-subtle">Rebill</p><p className="font-medium text-green-dark">{formatUSD(c.rebill_usd, 4)}</p></div>
                  <a href={`/api/reports/clients/${c.client_id}/export?${rangeQuery(range)}`} className="text-xs text-ink-muted hover:text-ink border border-border px-3 py-1.5 rounded" style={{ borderWidth: '0.5px' }}>CSV</a>
                </div>
              </div>
              <BucketTable
                title="Project"
                rows={c.projects.map(p => ({ key: p.project_id, name: p.project_name, calls: p.calls, blocked: p.blocked, provider_cost_usd: p.provider_cost_usd, price_usd: p.price_usd, rebill_usd: p.rebill_usd }))}
                linkFor={r => `/dashboard/projects/${r.key}`}
              />
            </Card>
          ))}
        </>
      )}
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
