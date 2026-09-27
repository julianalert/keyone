'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { KeyRevealModal } from '@/components/keys/KeyRevealModal'
import { RangePicker, rangeQuery, type RangeState } from '@/components/reports/RangePicker'
import { BucketTable, type BucketRow } from '@/components/reports/BucketTable'
import { formatUSD, formatDate } from '@/lib/utils'

interface ClientReport {
  range: { label: string }
  totals: { calls: number; blocked: number; input_tokens: number; output_tokens: number; price_usd: number; rebill_usd: number }
  by_project: BucketRow[]
  by_tool: BucketRow[]
  by_model: BucketRow[]
}

interface ClientDetail {
  id: string
  name: string
  rebill_markup_pct: number
  monthly_budget_usd: number | null
  is_active: boolean
  created_at: string
  month_spend_usd: number
}

interface ProjectRow {
  id: string
  name: string
  monthly_budget_usd: number | null
  is_active: boolean
  created_at: string
  month_spend_usd: number
  key_prefix: string | null
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [client, setClient] = useState<ClientDetail | null>(null)
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newKey, setNewKey] = useState<{ project: ProjectRow; api_key: string } | null>(null)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editMarkup, setEditMarkup] = useState('')
  const [editBudget, setEditBudget] = useState('')
  const [saving, setSaving] = useState(false)
  const [range, setRange] = useState<RangeState>({ range: 'this_month', from: '', to: '' })
  const [report, setReport] = useState<ClientReport | null>(null)
  const [reportTab, setReportTab] = useState<'by_project' | 'by_tool' | 'by_model'>('by_project')

  useEffect(() => {
    fetch(`/api/reports/clients/${id}?${rangeQuery(range)}`).then(r => (r.ok ? r.json() : null)).then(setReport).catch(() => setReport(null))
  }, [id, range])

  const fetchData = useCallback(async () => {
    const [clientRes, projectsRes] = await Promise.all([
      fetch(`/api/clients/${id}`),
      fetch(`/api/clients/${id}/projects`),
    ])
    if (!clientRes.ok) { router.push('/dashboard/clients'); return }
    const c = await clientRes.json()
    setClient(c)
    setEditName(c.name)
    setEditMarkup(c.rebill_markup_pct ? String(c.rebill_markup_pct) : '')
    setEditBudget(c.monthly_budget_usd?.toString() ?? '')
    setProjects(await projectsRes.json())
    setLoading(false)
  }, [id, router])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleSave() {
    setSaving(true)
    await fetch(`/api/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editName,
        rebill_markup_pct: editMarkup ? Number(editMarkup) : 0,
        monthly_budget_usd: editBudget ? Number(editBudget) : null,
      }),
    })
    await fetchData()
    setSaving(false)
    setEditing(false)
  }

  async function handleDeactivate() {
    if (!confirm(`Deactivate ${client?.name}? All of its project keys stop working immediately.`)) return
    await fetch(`/api/clients/${id}`, { method: 'DELETE' })
    await fetchData()
  }

  if (loading || !client) {
    return <div className="p-8"><div className="text-sm text-ink-muted">Loading...</div></div>
  }

  const markup = Number(client.rebill_markup_pct ?? 0)
  const rebill = client.month_spend_usd * (1 + markup / 100)
  const budgetUsed = client.monthly_budget_usd ? Math.min(100, (client.month_spend_usd / client.monthly_budget_usd) * 100) : null

  return (
    <div className="p-8">
      <div className="flex items-center gap-2 text-sm text-ink-muted mb-6">
        <Link href="/dashboard/clients" className="hover:text-ink transition-colors">Clients</Link>
        <span>/</span>
        <span className="text-ink">{client.name}</span>
      </div>

      {newKey && (
        <KeyRevealModal
          title={newKey.project.name}
          subtitle={`${client.name} · project key`}
          apiKey={newKey.api_key}
          onClose={() => { setNewKey(null); fetchData() }}
        />
      )}

      {showCreate && (
        <CreateProjectModal
          clientId={id}
          onClose={() => setShowCreate(false)}
          onCreated={(project, key) => { setShowCreate(false); setNewKey({ project, api_key: key }) }}
        />
      )}

      <div className="mb-8 flex items-start justify-between">
        <div>
          {editing ? (
            <Input value={editName} onChange={e => setEditName(e.target.value)} className="text-2xl font-normal serif mb-1 w-72" />
          ) : (
            <h1 className="serif text-4xl font-normal mb-1">{client.name}</h1>
          )}
          <div className="flex items-center gap-2">
            <Badge variant={client.is_active ? 'green' : 'default'}>{client.is_active ? 'Active' : 'Inactive'}</Badge>
            <span className="text-xs text-ink-subtle">Since {formatDate(client.created_at)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
              <Button size="sm" loading={saving} onClick={handleSave}>Save</Button>
            </>
          ) : (
            <>
              <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>Edit</Button>
              {client.is_active && <Button variant="ghost" size="sm" onClick={handleDeactivate}>Deactivate</Button>}
              {client.is_active && <Button size="sm" onClick={() => setShowCreate(true)}>New project</Button>}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4">
        <Card className="p-5">
          <p className="text-xs text-ink-subtle mb-1">Cost this month</p>
          <p className="serif text-3xl font-normal text-green-dark">{formatUSD(client.month_spend_usd, 4)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-ink-subtle mb-1">Rebill this month</p>
          <p className="serif text-3xl font-normal text-ink">{formatUSD(rebill, 4)}</p>
          {editing ? (
            <Input value={editMarkup} onChange={e => setEditMarkup(e.target.value)} type="number" placeholder="Markup %" min="0" step="0.5" className="mt-2" />
          ) : (
            <p className="text-xs text-ink-muted mt-1">{markup > 0 ? `+${markup}% markup` : 'No markup set'}</p>
          )}
        </Card>
        <Card className="p-5">
          <p className="text-xs text-ink-subtle mb-1">Monthly budget</p>
          {editing ? (
            <Input value={editBudget} onChange={e => setEditBudget(e.target.value)} type="number" placeholder="No limit" min="0" step="0.01" />
          ) : (
            <p className="serif text-3xl font-normal text-ink">{client.monthly_budget_usd ? formatUSD(client.monthly_budget_usd, 2) : '—'}</p>
          )}
        </Card>
        <Card className="p-5">
          <p className="text-xs text-ink-subtle mb-1">Projects</p>
          <p className="serif text-3xl font-normal text-ink">{projects.filter(p => p.is_active).length}</p>
        </Card>
      </div>

      {budgetUsed !== null && (
        <div className="mb-8">
          <div className="flex justify-between text-xs text-ink-muted mb-1.5">
            <span>Client budget used</span>
            <span>{budgetUsed.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${budgetUsed}%`, background: budgetUsed > 80 ? '#DC2626' : '#97C459' }} />
          </div>
        </div>
      )}

      <Card>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '0.5px solid #e0ddd7' }}>
          <p className="text-sm font-medium text-ink">Projects</p>
          <p className="text-xs text-ink-muted">One key per project, valid for every tool</p>
        </div>
        {projects.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-ink-muted mb-4">No projects yet. Create one to get its key.</p>
            {client.is_active && <Button onClick={() => setShowCreate(true)}>Create first project</Button>}
          </div>
        ) : (
          <div>
            {projects.map((p, i) => (
              <div
                key={p.id}
                className="px-5 py-4 flex items-center justify-between hover:bg-border/20 transition-colors text-sm"
                style={i < projects.length - 1 ? { borderBottom: '0.5px solid #e0ddd7' } : undefined}
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-green-pale flex items-center justify-center text-base">🔑</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/projects/${p.id}`} className="font-medium text-ink hover:underline underline-offset-2">{p.name}</Link>
                      <Badge variant={p.is_active ? 'green' : 'default'}>{p.is_active ? 'Active' : 'Inactive'}</Badge>
                    </div>
                    <p className="text-xs text-ink-subtle mt-0.5 font-mono">{p.key_prefix ? `${p.key_prefix}••••••••` : 'no active key'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  {p.monthly_budget_usd && (
                    <div className="text-right hidden sm:block">
                      <p className="text-ink-muted text-xs">Budget</p>
                      <p className="text-ink">{formatUSD(p.monthly_budget_usd, 2)}/mo</p>
                    </div>
                  )}
                  <div className="text-right">
                    <p className="text-ink-muted text-xs">This month</p>
                    <p className="text-green-dark font-medium">{formatUSD(p.month_spend_usd, 4)}</p>
                  </div>
                  <Link href={`/dashboard/projects/${p.id}`} className="text-ink-muted hover:text-ink text-xs border border-border px-3 py-1.5 rounded transition-colors" style={{ borderWidth: '0.5px' }}>
                    Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Report */}
      <Card className="mt-6">
        <div className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap" style={{ borderBottom: '0.5px solid #e0ddd7' }}>
          <div>
            <p className="text-sm font-medium text-ink">Report</p>
            <p className="text-xs text-ink-muted">{report?.range.label ?? '…'} · rebill at {markup}% markup</p>
          </div>
          <div className="flex items-center gap-3">
            <RangePicker value={range} onChange={setRange} />
            <a href={`/api/reports/clients/${id}/export?${rangeQuery(range)}`} className="btn-primary text-xs px-4 py-2 rounded">Export CSV</a>
          </div>
        </div>
        {report && (
          <>
            <div className="px-5 py-4 grid grid-cols-3 gap-4" style={{ borderBottom: '0.5px solid #e0ddd7' }}>
              <div><p className="text-xs text-ink-subtle">Spent</p><p className="text-lg text-ink">{formatUSD(report.totals.price_usd, 4)}</p></div>
              <div><p className="text-xs text-ink-subtle">Rebill</p><p className="text-lg font-medium text-green-dark">{formatUSD(report.totals.rebill_usd, 4)}</p></div>
              <div><p className="text-xs text-ink-subtle">Calls · tokens</p><p className="text-lg text-ink">{report.totals.calls} · {(report.totals.input_tokens + report.totals.output_tokens).toLocaleString()}</p></div>
            </div>
            <div className="px-5 pt-3 flex gap-1.5">
              {(['by_project', 'by_tool', 'by_model'] as const).map(t => (
                <button key={t} onClick={() => setReportTab(t)} className={`px-3 py-1 rounded text-xs transition-colors ${reportTab === t ? 'bg-ink text-bg' : 'text-ink-muted hover:text-ink border border-border'}`} style={{ borderWidth: '0.5px' }}>
                  {t === 'by_project' ? 'By project' : t === 'by_tool' ? 'By tool' : 'By model'}
                </button>
              ))}
            </div>
            <div className="pt-2">
              <BucketTable
                title={reportTab === 'by_project' ? 'Project' : reportTab === 'by_tool' ? 'Tool' : 'Model'}
                rows={report[reportTab]}
                linkFor={reportTab === 'by_project' ? r => `/dashboard/projects/${r.key}` : undefined}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  )
}

function CreateProjectModal({ clientId, onClose, onCreated }: {
  clientId: string
  onClose: () => void
  onCreated: (project: ProjectRow, key: string) => void
}) {
  const [name, setName] = useState('')
  const [budget, setBudget] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch(`/api/clients/${clientId}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), monthly_budget_usd: budget ? Number(budget) : null }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to create project')
      setLoading(false)
      return
    }
    const { api_key, ...project } = data
    onCreated(project, api_key)
  }

  return (
    <div className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="serif text-2xl font-normal">New project</h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink text-lg leading-none">×</button>
        </div>
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input id="project-name" label="Project name" placeholder="Blog writer" value={name} onChange={e => setName(e.target.value)} required autoFocus />
          <Input id="project-budget" label="Monthly budget cap (optional)" type="number" placeholder="50.00" value={budget} onChange={e => setBudget(e.target.value)} min="0" step="0.01" />
          <p className="text-xs text-ink-muted">A key is issued when the project is created. It works for every tool in the catalog.</p>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-3 mt-1">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" loading={loading} className="flex-1">Create and issue key</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
