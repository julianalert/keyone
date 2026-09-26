'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { KeyRevealModal } from '@/components/keys/KeyRevealModal'
import { formatUSD, formatDate, formatDateShort } from '@/lib/utils'

interface ProjectKeyRow {
  id: string
  name: string
  key_prefix: string
  last_used_at: string | null
  revoked_at: string | null
  frozen_at: string | null
  frozen_reason: string | null
  created_at: string
}

interface BudgetRequestRow {
  id: string
  requested_by: string
  current_budget_usd: number | null
  requested_budget_usd: number
  reason: string | null
  status: 'pending' | 'approved' | 'denied'
  auto_approved: boolean
  decided_at: string | null
  decided_by: string | null
  created_at: string
}

interface CatalogEntry { slug: string; name: string; icon: string | null }

interface ProjectDetail {
  id: string
  client_id: string
  name: string
  monthly_budget_usd: number | null
  max_cost_per_call_usd: number | null
  allowed_apis: string[] | null
  allowed_models: string[] | null
  is_active: boolean
  created_at: string
  client: { id: string; name: string } | null
  month_spend_usd: number
  today_calls: number
  blocked_this_month: number
  keys: ProjectKeyRow[]
}

interface ApiCall {
  id: string
  response_status: number | null
  cost_usd: number
  duration_ms: number | null
  created_at: string
  model: string | null
  input_tokens: number | null
  output_tokens: number | null
  status: string
  blocked_reason: string | null
}

interface TimelinePoint { date: string; spend_usd: number }

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [calls, setCalls] = useState<ApiCall[]>([])
  const [timeline, setTimeline] = useState<TimelinePoint[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editBudget, setEditBudget] = useState('')
  const [editCap, setEditCap] = useState('')
  const [editAllowed, setEditAllowed] = useState<string[]>([])
  const [editModels, setEditModels] = useState('')
  const [catalog, setCatalog] = useState<CatalogEntry[]>([])
  const [saving, setSaving] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [keyBusy, setKeyBusy] = useState(false)
  const [requests, setRequests] = useState<BudgetRequestRow[]>([])

  const fetchData = useCallback(async () => {
    const [projectRes, analyticsRes, timelineRes, catalogRes, requestsRes] = await Promise.all([
      fetch(`/api/projects/${id}`),
      fetch(`/api/analytics/projects/${id}`),
      fetch(`/api/analytics/timeline?project_id=${id}&days=30`),
      fetch('/api/catalog'),
      fetch(`/api/projects/${id}/requests`),
    ])
    if (!projectRes.ok) { router.push('/dashboard/clients'); return }

    const p = await projectRes.json()
    const analytics = await analyticsRes.json()
    const tl = await timelineRes.json()
    setCatalog(await catalogRes.json())
    setRequests(requestsRes.ok ? await requestsRes.json() : [])

    setProject(p)
    setEditName(p.name)
    setEditBudget(p.monthly_budget_usd?.toString() ?? '')
    setEditCap(p.max_cost_per_call_usd?.toString() ?? '')
    setEditAllowed(p.allowed_apis ?? [])
    setEditModels((p.allowed_models ?? []).join(', '))
    setCalls(analytics.recent_calls ?? [])
    setTimeline(tl.timeline ?? [])
    setLoading(false)
  }, [id, router])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleSave() {
    setSaving(true)
    await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editName,
        monthly_budget_usd: editBudget ? Number(editBudget) : null,
        max_cost_per_call_usd: editCap ? Number(editCap) : null,
        allowed_apis: editAllowed,
        allowed_models: editModels.split(',').map(s => s.trim()).filter(Boolean),
      }),
    })
    await fetchData()
    setSaving(false)
    setEditing(false)
  }

  async function handleToggleActive() {
    if (!project) return
    if (project.is_active && !confirm(`Deactivate ${project.name}? Its keys stop working immediately.`)) return
    await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !project.is_active }),
    })
    await fetchData()
  }

  async function handleRotate() {
    if (!confirm('Issue a new key and revoke the current one? Anything using the old key will stop working.')) return
    setKeyBusy(true)
    const res = await fetch(`/api/projects/${id}/keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ revoke_others: true }),
    })
    const data = await res.json()
    setKeyBusy(false)
    if (res.ok) setNewKey(data.api_key)
  }

  async function handleIssueAdditional() {
    setKeyBusy(true)
    const res = await fetch(`/api/projects/${id}/keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'additional' }),
    })
    const data = await res.json()
    setKeyBusy(false)
    if (res.ok) setNewKey(data.api_key)
  }

  async function handleUnfreeze(keyId: string) {
    if (!confirm('Unfreeze this key? Make sure you know what it was doing when it spiked.')) return
    await fetch(`/api/projects/${id}/keys/${keyId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frozen: false }),
    })
    await fetchData()
  }

  async function handleDecide(requestId: string, action: 'approve' | 'deny') {
    await fetch(`/api/requests/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    await fetchData()
  }

  async function handleRevoke(keyId: string) {
    if (!confirm('Revoke this key? This cannot be undone.')) return
    await fetch(`/api/projects/${id}/keys/${keyId}`, { method: 'DELETE' })
    await fetchData()
  }

  if (loading || !project) {
    return <div className="p-8"><div className="text-sm text-ink-muted">Loading...</div></div>
  }

  const activeKeys = project.keys.filter(k => !k.revoked_at)
  const revokedKeys = project.keys.filter(k => k.revoked_at)
  const totalTimelineSpend = timeline.reduce((s, p) => s + p.spend_usd, 0)
  const budgetUsed = project.monthly_budget_usd ? Math.min(100, (project.month_spend_usd / project.monthly_budget_usd) * 100) : null

  return (
    <div className="p-8">
      <div className="flex items-center gap-2 text-sm text-ink-muted mb-6">
        <Link href="/dashboard/clients" className="hover:text-ink transition-colors">Clients</Link>
        <span>/</span>
        {project.client ? (
          <Link href={`/dashboard/clients/${project.client.id}`} className="hover:text-ink transition-colors">{project.client.name}</Link>
        ) : <span>—</span>}
        <span>/</span>
        <span className="text-ink">{project.name}</span>
      </div>

      {newKey && (
        <KeyRevealModal
          title={project.name}
          subtitle={`${project.client?.name ?? ''} · project key`}
          apiKey={newKey}
          onClose={() => { setNewKey(null); fetchData() }}
        />
      )}

      <div className="mb-8 flex items-start justify-between">
        <div>
          {editing ? (
            <Input value={editName} onChange={e => setEditName(e.target.value)} className="text-2xl font-normal serif mb-1 w-72" />
          ) : (
            <h1 className="serif text-4xl font-normal mb-1">{project.name}</h1>
          )}
          <div className="flex items-center gap-2">
            <Badge variant={project.is_active ? 'green' : 'default'}>{project.is_active ? 'Active' : 'Inactive'}</Badge>
            <span className="text-xs text-ink-subtle">{activeKeys.length} active key{activeKeys.length === 1 ? '' : 's'}</span>
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
              <Button variant="ghost" size="sm" onClick={handleToggleActive}>{project.is_active ? 'Deactivate' : 'Reactivate'}</Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4">
        <Card className="p-5">
          <p className="text-xs text-ink-subtle mb-1">This month</p>
          <p className="serif text-3xl font-normal text-green-dark">{formatUSD(project.month_spend_usd, 4)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-ink-subtle mb-1">Calls today</p>
          <p className="serif text-3xl font-normal text-ink">{project.today_calls}</p>
          {project.blocked_this_month > 0 && (
            <p className="text-xs text-red-600 mt-1">{project.blocked_this_month} blocked this month</p>
          )}
        </Card>
        <Card className="p-5">
          <p className="text-xs text-ink-subtle mb-1">Monthly budget</p>
          {editing ? (
            <Input value={editBudget} onChange={e => setEditBudget(e.target.value)} type="number" placeholder="No limit" min="0" step="0.01" />
          ) : (
            <p className="serif text-3xl font-normal text-ink">{project.monthly_budget_usd ? formatUSD(project.monthly_budget_usd, 2) : '—'}</p>
          )}
        </Card>
        <Card className="p-5">
          <p className="text-xs text-ink-subtle mb-1">Max per call</p>
          {editing ? (
            <Input value={editCap} onChange={e => setEditCap(e.target.value)} type="number" placeholder="No cap" min="0" step="0.0001" />
          ) : (
            <p className="serif text-3xl font-normal text-ink">{project.max_cost_per_call_usd ? formatUSD(Number(project.max_cost_per_call_usd), 4) : '—'}</p>
          )}
        </Card>
      </div>

      {/* Allowed tools + models */}
      <Card className="mb-6">
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '0.5px solid #e0ddd7' }}>
          <div>
            <p className="text-sm font-medium text-ink">Allowed tools</p>
            <p className="text-xs text-ink-muted">Calls to any other tool are blocked. Nothing selected means everything is allowed.</p>
          </div>
          {!editing && (
            <span className="text-xs text-ink-muted">
              {project.allowed_apis && project.allowed_apis.length > 0 ? `${project.allowed_apis.length} of ${catalog.length}` : 'All tools'}
            </span>
          )}
        </div>
        <CardContent className="flex flex-wrap gap-2">
          {catalog.map(api => {
            const on = editing ? editAllowed.includes(api.slug) : (!project.allowed_apis || project.allowed_apis.length === 0 || project.allowed_apis.includes(api.slug))
            return (
              <button
                key={api.slug}
                type="button"
                disabled={!editing}
                onClick={() => setEditAllowed(prev => prev.includes(api.slug) ? prev.filter(s => s !== api.slug) : [...prev, api.slug])}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${on ? 'bg-green-pale text-green-dark' : 'bg-transparent text-ink-subtle'} ${editing ? 'cursor-pointer hover:border-ink-muted' : 'cursor-default'}`}
                style={{ borderWidth: '0.5px', borderColor: on ? '#97C459' : '#e0ddd7' }}
              >
                {api.icon ? `${api.icon} ` : ''}{api.name}
              </button>
            )
          })}
        </CardContent>
      </Card>

      {budgetUsed !== null && (
        <div className="mb-6">
          <div className="flex justify-between text-xs text-ink-muted mb-1.5">
            <span>Budget used</span>
            <span>{budgetUsed.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${budgetUsed}%`, background: budgetUsed > 80 ? '#DC2626' : '#97C459' }} />
          </div>
        </div>
      )}

      {/* Keys */}
      <Card className="mb-6">
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '0.5px solid #e0ddd7' }}>
          <div>
            <p className="text-sm font-medium text-ink">Project keys</p>
            <p className="text-xs text-ink-muted">One key works for every tool in the catalog. Rotate if a key leaks.</p>
          </div>
          {project.is_active && (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" loading={keyBusy} onClick={handleIssueAdditional}>Issue additional</Button>
              <Button size="sm" loading={keyBusy} onClick={handleRotate}>Rotate</Button>
            </div>
          )}
        </div>
        {project.keys.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-ink-muted">No keys. Issue one to start calling.</div>
        ) : (
          <div>
            {[...activeKeys, ...revokedKeys].map((k, i, arr) => (
              <div
                key={k.id}
                className="px-5 py-3 text-sm"
                style={i < arr.length - 1 ? { borderBottom: '0.5px solid #e0ddd7' } : undefined}
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-ink">{k.key_prefix}••••••••</span>
                    <Badge variant={k.revoked_at ? 'default' : k.frozen_at ? 'red' : 'green'}>
                      {k.revoked_at ? 'Revoked' : k.frozen_at ? 'Frozen' : 'Active'}
                    </Badge>
                    <span className="text-xs text-ink-muted">{k.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-ink-muted">
                      {k.revoked_at ? `Revoked ${formatDate(k.revoked_at)}` : k.last_used_at ? `Last used ${formatDate(k.last_used_at)}` : 'Never used'}
                    </span>
                    {!k.revoked_at && k.frozen_at && (
                      <button onClick={() => handleUnfreeze(k.id)} className="text-xs font-medium text-green-dark hover:underline">Unfreeze</button>
                    )}
                    {!k.revoked_at && (
                      <button onClick={() => handleRevoke(k.id)} className="text-xs text-ink-muted hover:text-red-600 transition-colors">Revoke</button>
                    )}
                  </div>
                </div>
                {k.frozen_at && k.frozen_reason && (
                  <p className="text-xs text-red-600 mt-1.5">{k.frozen_reason}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Budget requests */}
      {requests.length > 0 && (
        <Card className="mb-6">
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '0.5px solid #e0ddd7' }}>
            <div>
              <p className="text-sm font-medium text-ink">Budget requests</p>
              <p className="text-xs text-ink-muted">Filed by agents when a call is blocked, or by you.</p>
            </div>
            {requests.some(r => r.status === 'pending') && <Badge variant="yellow">{requests.filter(r => r.status === 'pending').length} pending</Badge>}
          </div>
          <div>
            {requests.map((r, i) => (
              <div key={r.id} className="px-5 py-3 flex items-center justify-between gap-4 text-sm" style={i < requests.length - 1 ? { borderBottom: '0.5px solid #e0ddd7' } : undefined}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-ink">
                      {r.current_budget_usd !== null ? `${formatUSD(Number(r.current_budget_usd), 2)} → ` : ''}<span className="font-medium">{formatUSD(Number(r.requested_budget_usd), 2)}</span>/mo
                    </span>
                    <Badge variant={r.status === 'pending' ? 'yellow' : r.status === 'approved' ? 'green' : 'default'}>
                      {r.status}{r.auto_approved ? ' · auto' : ''}
                    </Badge>
                    <span className="text-xs text-ink-subtle">by {r.requested_by} · {formatDate(r.created_at)}</span>
                  </div>
                  {r.reason && <p className="text-xs text-ink-muted mt-0.5 truncate" title={r.reason}>{r.reason}</p>}
                </div>
                {r.status === 'pending' && (
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="secondary" onClick={() => handleDecide(r.id, 'deny')}>Deny</Button>
                    <Button size="sm" onClick={() => handleDecide(r.id, 'approve')}>Approve</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Spend timeline */}
      <Card className="mb-6">
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '0.5px solid #e0ddd7' }}>
          <p className="text-sm font-medium text-ink">Spend, last 30 days</p>
          <p className="text-sm text-ink-muted">{formatUSD(totalTimelineSpend, 4)} total</p>
        </div>
        <CardContent className="pt-4">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={timeline} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#97C459" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#97C459" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0ddd7" />
              <XAxis dataKey="date" tickFormatter={v => formatDateShort(v)} tick={{ fontSize: 11, fill: '#888780' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tickFormatter={v => `$${v.toFixed(4)}`} tick={{ fontSize: 11, fill: '#888780' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v) => [formatUSD(Number(v), 6), 'Spend']}
                labelFormatter={l => formatDateShort(l as string)}
                contentStyle={{ background: '#1a1a18', border: 'none', borderRadius: '8px', color: '#C0DD97', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="spend_usd" stroke="#97C459" strokeWidth={2} fill="url(#spendGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Call log */}
      <Card>
        <div className="px-5 py-4" style={{ borderBottom: '0.5px solid #e0ddd7' }}>
          <p className="text-sm font-medium text-ink">Recent calls</p>
        </div>
        {calls.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-ink-muted">No calls yet. Point your agent at the proxy with this project&apos;s key.</div>
        ) : (
          <div>
            <div className="px-5 py-2 grid grid-cols-5 gap-4 text-2xs text-ink-subtle uppercase tracking-wider" style={{ borderBottom: '0.5px solid #e0ddd7' }}>
              <span>Status</span><span>Model</span><span>Tokens</span><span>Cost</span><span>Time</span>
            </div>
            {calls.map((call, i) => (
              <div
                key={call.id}
                className="px-5 py-3 grid grid-cols-5 gap-4 text-sm hover:bg-border/20 transition-colors"
                style={i < calls.length - 1 ? { borderBottom: '0.5px solid #e0ddd7' } : undefined}
              >
                <span className="flex flex-col items-start gap-1 min-w-0">
                  <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: call.status === 'blocked' ? '#FEF3C7' : call.response_status && call.response_status < 300 ? '#EAF3DE' : '#FEF2F2', color: call.status === 'blocked' ? '#92400E' : call.response_status && call.response_status < 300 ? '#3B6D11' : '#DC2626' }}>
                    {call.status === 'blocked' ? 'BLOCKED' : call.response_status ?? '???'}
                  </span>
                  {call.blocked_reason && (
                    <span className="text-2xs text-ink-subtle truncate max-w-full" title={call.blocked_reason}>
                      {call.blocked_reason.replace(/^project_|^client_/, '').replace(/_/g, ' ')}
                    </span>
                  )}
                </span>
                <span className="text-ink-muted font-mono text-xs">{call.model ?? '—'}</span>
                <span className="text-ink-muted text-xs">{call.input_tokens != null && call.output_tokens != null ? `${call.input_tokens}+${call.output_tokens}` : '—'}</span>
                <span className="text-ink font-medium">{formatUSD(Number(call.cost_usd), 6)}</span>
                <span className="text-ink-muted">{formatDate(call.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
