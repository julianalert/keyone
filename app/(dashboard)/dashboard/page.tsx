import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { formatUSD, formatDate } from '@/lib/utils'
import { getSessionContext, periodBounds } from '@/lib/agency'

async function getOverviewData() {
  const ctx = await getSessionContext()
  if (!ctx) redirect('/login')
  const { supabase, agencyId } = ctx
  const { monthStart, dayStart } = periodBounds()

  const [walletRes, monthCallsRes, todayRes, clientsRes, projectsRes, recentRes, alertsRes, pendingRes] = await Promise.all([
    supabase.from('wallets').select('balance_usd').eq('agency_id', agencyId).single(),
    supabase.from('api_calls').select('cost_usd, client_id, project_id').eq('agency_id', agencyId).gte('created_at', monthStart),
    supabase.from('api_calls').select('id', { count: 'exact', head: true }).eq('agency_id', agencyId).gte('created_at', dayStart),
    supabase.from('clients').select('id, name').eq('agency_id', agencyId).eq('is_active', true),
    supabase.from('projects').select('id, name, client_id').eq('agency_id', agencyId).eq('is_active', true),
    supabase
      .from('api_calls')
      .select('id, cost_usd, created_at, response_status, project_id, client_id')
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false })
      .limit(6),
    supabase.from('alerts').select('id, kind, scope, scope_id, title, data, created_at, read_at').eq('agency_id', agencyId).order('created_at', { ascending: false }).limit(6),
    supabase.from('budget_requests').select('id', { count: 'exact', head: true }).eq('agency_id', agencyId).eq('status', 'pending'),
  ])

  const clients = clientsRes.data ?? []
  const projects = projectsRes.data ?? []
  const clientSpend: Record<string, number> = {}
  const projectSpend: Record<string, number> = {}
  let monthSpend = 0
  for (const c of monthCallsRes.data ?? []) {
    const cost = Number(c.cost_usd)
    monthSpend += cost
    clientSpend[c.client_id] = (clientSpend[c.client_id] ?? 0) + cost
    projectSpend[c.project_id] = (projectSpend[c.project_id] ?? 0) + cost
  }

  const clientRows = clients
    .map(c => ({ ...c, spend: clientSpend[c.id] ?? 0, projects: projects.filter(p => p.client_id === c.id).length }))
    .sort((a, b) => b.spend - a.spend)

  const nameOf = (rows: { id: string; name: string }[], id: string) => rows.find(r => r.id === id)?.name ?? '—'

  return {
    balance: Number(walletRes.data?.balance_usd ?? 0),
    monthSpend,
    todayCount: todayRes.count ?? 0,
    activeClients: clients.length,
    activeProjects: projects.length,
    clientRows,
    alerts: alertsRes.data ?? [],
    pendingRequests: pendingRes.count ?? 0,
    recentCalls: (recentRes.data ?? []).map(c => ({
      ...c,
      client_name: nameOf(clients, c.client_id),
      project_name: nameOf(projects, c.project_id),
    })),
  }
}

export default async function DashboardPage() {
  const data = await getOverviewData()
  const isLowBalance = data.balance < 5

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="serif text-4xl font-normal">Overview</h1>
        </div>
        <Link href="/dashboard/wallet" className="btn-primary text-sm px-4 py-2 rounded">
          Add funds
        </Link>
      </div>

      {isLowBalance && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-amber-50 border text-sm text-amber-800 flex items-center justify-between" style={{ borderColor: '#fcd34d', borderWidth: '0.5px' }}>
          <span>⚠️ Wallet balance is low. Every project key stops working at $0.</span>
          <Link href="/dashboard/wallet" className="font-medium underline underline-offset-2">Top up →</Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4">
        <MetricCard label="Wallet balance" value={formatUSD(data.balance, 2)} sub={isLowBalance ? 'Running low' : 'Available'} accent={isLowBalance ? 'red' : 'green'} />
        <MetricCard label="Spent this month" value={formatUSD(data.monthSpend, 2)} sub="All clients" />
        <MetricCard label="Calls today" value={data.todayCount.toLocaleString()} sub="Across all projects" />
        <MetricCard label="Active" value={`${data.activeClients} · ${data.activeProjects}`} sub="Clients · projects" />
      </div>

      {data.pendingRequests > 0 && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-amber-50 border text-sm text-amber-800 flex items-center justify-between" style={{ borderColor: '#fcd34d', borderWidth: '0.5px' }}>
          <span>{data.pendingRequests} budget request{data.pendingRequests === 1 ? '' : 's'} waiting for your decision.</span>
          <Link href="/dashboard/clients" className="font-medium underline underline-offset-2">Review →</Link>
        </div>
      )}

      {data.alerts.length > 0 && (
        <Card className="mb-6">
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '0.5px solid #e0ddd7' }}>
            <p className="text-sm font-medium text-ink">Alerts</p>
            <p className="text-xs text-ink-muted">Budget thresholds, frozen keys, requests</p>
          </div>
          <div>
            {data.alerts.map((a, i, arr) => {
              const href = alertHref(a)
              return (
                <Link key={a.id} href={href} className="px-5 py-3 flex items-center justify-between gap-4 text-sm hover:bg-border/30 transition-colors" style={i < arr.length - 1 ? { borderBottom: '0.5px solid #e0ddd7' } : undefined}>
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs px-1.5 py-0.5 rounded font-mono shrink-0" style={{ background: a.kind === 'key_frozen' ? '#FEF2F2' : a.kind === 'wallet_topup' ? '#EAF3DE' : '#FEF3C7', color: a.kind === 'key_frozen' ? '#DC2626' : a.kind === 'wallet_topup' ? '#3B6D11' : '#92400E' }}>
                      {a.kind.replace(/_/g, ' ')}
                    </span>
                    <span className={`truncate ${a.read_at ? 'text-ink-muted' : 'text-ink'}`}>{a.title}</span>
                  </div>
                  <span className="text-xs text-ink-muted shrink-0">{formatDate(a.created_at)}</span>
                </Link>
              )
            })}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '0.5px solid #e0ddd7' }}>
            <p className="text-sm font-medium text-ink">Spend by client</p>
            <p className="text-xs text-ink-muted">This month</p>
          </div>
          {data.clientRows.length === 0 ? (
            <CardContent>
              <div className="text-center py-4">
                <p className="text-sm text-ink-muted mb-3">No clients yet</p>
                <Link href="/dashboard/clients" className="btn-primary text-xs px-4 py-2 rounded">Add a client</Link>
              </div>
            </CardContent>
          ) : (
            <div>
              {data.clientRows.map((c, i, arr) => (
                <Link
                  key={c.id}
                  href={`/dashboard/clients/${c.id}`}
                  className="flex items-center justify-between px-5 py-3 text-sm hover:bg-border/30 transition-colors"
                  style={i < arr.length - 1 ? { borderBottom: '0.5px solid #e0ddd7' } : undefined}
                >
                  <div>
                    <p className="font-medium text-ink">{c.name}</p>
                    <p className="text-xs text-ink-muted">{c.projects} project{c.projects === 1 ? '' : 's'}</p>
                  </div>
                  <p className="font-medium text-green-dark">{formatUSD(c.spend, 4)}</p>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="px-5 py-4" style={{ borderBottom: '0.5px solid #e0ddd7' }}>
            <p className="text-sm font-medium text-ink">Quick start</p>
          </div>
          <CardContent className="p-0">
            {[
              { href: '/dashboard/clients', label: 'Add a client', desc: 'Every client is a cost center' },
              { href: '/dashboard/clients', label: 'Create a project', desc: 'Each project gets one key for every tool' },
              { href: '/dashboard/catalog', label: 'Browse the catalog', desc: 'See what the key can call' },
              { href: '/dashboard/wallet', label: 'Top up wallet', desc: 'One balance for the whole agency' },
            ].map((item, i, arr) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-border/30 transition-colors"
                style={i < arr.length - 1 ? { borderBottom: '0.5px solid #e0ddd7' } : undefined}
              >
                <div>
                  <p className="text-sm font-medium text-ink">{item.label}</p>
                  <p className="text-xs text-ink-muted">{item.desc}</p>
                </div>
                <span className="text-ink-muted text-sm">→</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {data.recentCalls.length > 0 && (
        <Card className="mt-6">
          <div className="px-5 py-4" style={{ borderBottom: '0.5px solid #e0ddd7' }}>
            <p className="text-sm font-medium text-ink">Recent calls</p>
          </div>
          <div>
            {data.recentCalls.map((call, i, arr) => (
              <div
                key={call.id}
                className="px-5 py-3 flex items-center justify-between text-sm"
                style={i < arr.length - 1 ? { borderBottom: '0.5px solid #e0ddd7' } : undefined}
              >
                <div className="flex items-center gap-3">
                  <StatusPill status={call.response_status} />
                  <span className="text-ink">{call.client_name} <span className="text-ink-subtle">/</span> {call.project_name}</span>
                  <span className="text-ink-muted text-xs">{formatDate(call.created_at)}</span>
                </div>
                <span className="text-ink font-medium">{formatUSD(Number(call.cost_usd), 6)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

// Where an alert should take you. Prefer the link the alert itself carries
// (a relative path is enough), then fall back by kind or scope.
function alertHref(a: { kind: string; scope: string; scope_id: string | null; data: Record<string, unknown> | null }): string {
  const links = (a.data?.links ?? null) as Record<string, string> | null
  const first = links ? Object.values(links)[0] : null
  if (first) {
    try { return new URL(first).pathname } catch { return first }
  }
  if (a.kind === 'wallet_topup' || a.kind === 'low_balance') return '/dashboard/wallet'
  if (a.kind === 'controller_digest') return '/dashboard/controller'
  if (a.scope === 'project' && a.scope_id) return `/dashboard/projects/${a.scope_id}`
  if (a.scope === 'client' && a.scope_id) return `/dashboard/clients/${a.scope_id}`
  return '/dashboard'
}

function StatusPill({ status }: { status: number | null }) {
  const ok = status !== null && status < 300
  return (
    <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: ok ? '#EAF3DE' : '#FEF2F2', color: ok ? '#3B6D11' : '#DC2626' }}>
      {status ?? '???'}
    </span>
  )
}

function MetricCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: 'green' | 'red' }) {
  return (
    <Card className="p-5">
      <p className="text-xs text-ink-subtle mb-1">{label}</p>
      <p className={`text-2xl font-normal serif ${accent === 'red' ? 'text-red-600' : accent === 'green' ? 'text-green-dark' : 'text-ink'}`}>{value}</p>
      <p className="text-xs text-ink-muted mt-1">{sub}</p>
    </Card>
  )
}
