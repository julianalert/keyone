'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDate, formatUSD } from '@/lib/utils'

interface Run { id: string; trigger: string; status: string; findings_count: number; digest: string | null; model: string | null; llm_cost_usd: number; error: string | null; created_at: string; completed_at: string | null }
interface Finding {
  id: string; run_id: string; severity: 'high' | 'medium' | 'low'; kind: string; scope: string; scope_id: string | null; scope_label: string
  title: string; detail: string; metrics: Record<string, unknown> | null
  action: { type: string; params: Record<string, unknown>; expected_effect: string } | null
  status: 'proposed' | 'applied' | 'dismissed'; decided_at: string | null; created_at: string
}

export default function ControllerPage() {
  const [latest, setLatest] = useState<Run | null>(null)
  const [runs, setRuns] = useState<Run[]>([])
  const [findings, setFindings] = useState<Finding[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [tab, setTab] = useState<'proposed' | 'applied' | 'dismissed'>('proposed')
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/controller/runs')
    const d = await res.json()
    setLatest(d.latest_run); setRuns(d.runs ?? []); setFindings(d.findings ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function runNow() {
    setRunning(true); setMsg(null)
    const res = await fetch('/api/controller/run', { method: 'POST' })
    const d = await res.json()
    setRunning(false)
    setMsg(res.ok ? `Run complete: ${d.findings.length} new finding${d.findings.length === 1 ? '' : 's'}.` : (d.error ?? 'Run failed'))
    load()
  }

  async function decide(id: string, action: 'apply' | 'dismiss') {
    setBusy(id); setMsg(null)
    const res = await fetch(`/api/controller/findings/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })
    const d = await res.json()
    setBusy(null)
    setMsg(res.ok ? d.result : (d.error ?? 'Failed'))
    load()
  }

  const shown = findings.filter(f => f.status === tab)
  const counts = { proposed: findings.filter(f => f.status === 'proposed').length, applied: findings.filter(f => f.status === 'applied').length, dismissed: findings.filter(f => f.status === 'dismissed').length }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="serif text-4xl font-normal">Spend review</h1>
          <p className="text-sm text-ink-muted mt-1">Runs daily. Notices, explains, proposes. Nothing changes until you apply it.</p>
        </div>
        <div className="flex items-center gap-3">
          {msg && <span className="text-xs text-ink-muted">{msg}</span>}
          <Button size="sm" loading={running} onClick={runNow}>Run now</Button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-ink-muted">Loading...</div>
      ) : (
        <>
          <Card className="mb-6">
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '0.5px solid #e0ddd7' }}>
              <p className="text-sm font-medium text-ink">Latest digest</p>
              {latest && (
                <p className="text-xs text-ink-muted">
                  {formatDate(latest.created_at)} · {latest.trigger} · {latest.findings_count} finding{latest.findings_count === 1 ? '' : 's'}
                  {latest.model ? ` · written by ${latest.model} (${formatUSD(Number(latest.llm_cost_usd), 6)})` : ' · deterministic'}
                </p>
              )}
            </div>
            <CardContent>
              {latest ? (
                latest.status === 'failed'
                  ? <p className="text-sm text-red-600">Run failed: {latest.error}</p>
                  : <p className="text-sm text-ink leading-relaxed whitespace-pre-line">{latest.digest}</p>
              ) : (
                <p className="text-sm text-ink-muted">No runs yet. Click Run now, or wait for the daily run.</p>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-1.5 mb-3">
            {(['proposed', 'applied', 'dismissed'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${tab === t ? 'bg-ink text-bg' : 'text-ink-muted hover:text-ink border border-border'}`} style={{ borderWidth: '0.5px' }}>
                {t[0].toUpperCase() + t.slice(1)} · {counts[t]}
              </button>
            ))}
          </div>

          {shown.length === 0 ? (
            <Card className="p-10 text-center text-sm text-ink-muted">
              {tab === 'proposed' ? 'Nothing to decide. Spend is within budgets and no anomalies were found.' : `No ${tab} findings.`}
            </Card>
          ) : shown.map(f => (
            <Card key={f.id} className="mb-3">
              <div className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant={f.severity === 'high' ? 'red' : f.severity === 'medium' ? 'yellow' : 'default'}>{f.severity}</Badge>
                      <span className="text-2xs text-ink-subtle uppercase tracking-wider">{f.kind.replace(/_/g, ' ')}</span>
                      {f.scope_id && f.scope === 'project' && <Link href={`/dashboard/projects/${f.scope_id}`} className="text-2xs text-ink-muted hover:underline">{f.scope_label} →</Link>}
                      {f.scope_id && f.scope === 'client' && <Link href={`/dashboard/clients/${f.scope_id}`} className="text-2xs text-ink-muted hover:underline">{f.scope_label} →</Link>}
                    </div>
                    <p className="text-sm font-medium text-ink">{f.title}</p>
                    <p className="text-sm text-ink-muted mt-1 leading-relaxed">{f.detail}</p>
                    {f.action && (
                      <p className="text-xs text-green-dark mt-2"><span className="font-medium">Proposal:</span> {f.action.expected_effect}</p>
                    )}
                    {f.status !== 'proposed' && f.decided_at && <p className="text-2xs text-ink-subtle mt-2">{f.status} {formatDate(f.decided_at)}</p>}
                  </div>
                  {f.status === 'proposed' && (
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="secondary" loading={busy === f.id} onClick={() => decide(f.id, 'dismiss')}>Dismiss</Button>
                      {f.action && <Button size="sm" loading={busy === f.id} onClick={() => decide(f.id, 'apply')}>Apply</Button>}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}

          {runs.length > 1 && (
            <div className="mt-8">
              <p className="text-xs text-ink-subtle uppercase tracking-wider mb-2">Previous runs</p>
              <Card>
                {runs.slice(1).map((r, i, arr) => (
                  <div key={r.id} className="px-5 py-2.5 flex items-center justify-between text-xs" style={i < arr.length - 1 ? { borderBottom: '0.5px solid #e0ddd7' } : undefined}>
                    <span className="text-ink-muted">{formatDate(r.created_at)} · {r.trigger}</span>
                    <span className={r.status === 'failed' ? 'text-red-600' : 'text-ink-muted'}>{r.status === 'failed' ? 'failed' : `${r.findings_count} findings`}</span>
                  </div>
                ))}
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )
}
