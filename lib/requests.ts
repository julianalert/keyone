import type { SupabaseClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { raiseAlert } from '@/lib/notify'

export interface BudgetRequestRow {
  id: string
  agency_id: string
  project_id: string
  project_key_id: string | null
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

const SELECT = 'id, agency_id, project_id, project_key_id, requested_by, current_budget_usd, requested_budget_usd, reason, status, auto_approved, decided_at, decided_by, created_at'

// File a request. Auto-approves when the increase is within the agency's
// threshold; otherwise alerts the owner with approve/deny links.
export async function createBudgetRequest(
  supabase: SupabaseClient,
  input: {
    agency_id: string
    project_id: string
    project_key_id?: string | null
    requested_by: 'agent' | 'user'
    requested_budget_usd: number
    reason?: string
    origin: string
  }
): Promise<BudgetRequestRow> {
  const [{ data: project }, { data: agency }] = await Promise.all([
    supabase.from('projects').select('id, name, client_id, monthly_budget_usd, clients(name)').eq('id', input.project_id).single(),
    supabase.from('agencies').select('auto_approve_increase_usd').eq('id', input.agency_id).single(),
  ])
  if (!project) throw new Error('Project not found')

  const current = project.monthly_budget_usd === null ? null : Number(project.monthly_budget_usd)
  const requested = Number(input.requested_budget_usd)
  if (!(requested > 0)) throw new Error('requested_budget_usd must be positive')
  if (current !== null && requested <= current) throw new Error('Requested budget must be higher than the current budget')

  const increase = current === null ? requested : requested - current
  const autoLimit = Number(agency?.auto_approve_increase_usd ?? 0)
  const auto = autoLimit > 0 && increase <= autoLimit

  const { data: row, error } = await supabase
    .from('budget_requests')
    .insert({
      agency_id: input.agency_id,
      project_id: input.project_id,
      project_key_id: input.project_key_id ?? null,
      requested_by: input.requested_by,
      current_budget_usd: current,
      requested_budget_usd: requested,
      reason: input.reason ?? null,
      decision_token: crypto.randomBytes(24).toString('hex'),
      ...(auto ? { status: 'approved', auto_approved: true, decided_at: new Date().toISOString(), decided_by: 'auto' } : {}),
    })
    .select(SELECT)
    .single()
  if (error || !row) throw new Error(error?.message ?? 'Failed to create request')

  const clientName = (project as unknown as { clients: { name: string } | null }).clients?.name ?? ''
  const label = `${clientName} / ${project.name}`

  if (auto) {
    await supabase.from('projects').update({ monthly_budget_usd: requested }).eq('id', input.project_id)
    await raiseAlert(supabase, {
      agency_id: input.agency_id,
      kind: 'budget_decided',
      scope: 'request',
      scope_id: row.id,
      title: `Budget for "${label}" auto-raised to $${requested.toFixed(2)}`,
      body: `Requested by ${input.requested_by}${input.reason ? `: ${input.reason}` : ''}. Increase of $${increase.toFixed(2)} was within your auto-approve limit of $${autoLimit.toFixed(2)}.`,
      data: { request_id: row.id, links: { 'Open project': `${input.origin}/dashboard/projects/${input.project_id}` } },
    })
  } else {
    const { data: tok } = await supabase.from('budget_requests').select('decision_token').eq('id', row.id).single()
    const base = `${input.origin}/api/requests/${row.id}/decide?token=${tok?.decision_token}`
    await raiseAlert(supabase, {
      agency_id: input.agency_id,
      kind: 'budget_request',
      scope: 'request',
      scope_id: row.id,
      title: `Budget request: "${label}" wants $${requested.toFixed(2)}/month${current !== null ? ` (now $${current.toFixed(2)})` : ''}`,
      body: `Requested by ${input.requested_by}${input.reason ? `: ${input.reason}` : ''}.`,
      data: { request_id: row.id, links: { Approve: `${base}&action=approve`, Deny: `${base}&action=deny`, 'Open project': `${input.origin}/dashboard/projects/${input.project_id}` } },
    })
  }

  return row as BudgetRequestRow
}

// Decide a pending request. Approval applies the new budget.
export async function decideBudgetRequest(
  supabase: SupabaseClient,
  requestId: string,
  action: 'approve' | 'deny',
  decidedBy: 'email' | 'dashboard' | 'mcp',
  opts: { agency_id?: string; token?: string; origin: string }
): Promise<BudgetRequestRow> {
  let q = supabase.from('budget_requests').select(`${SELECT}, decision_token`).eq('id', requestId)
  if (opts.agency_id) q = q.eq('agency_id', opts.agency_id)
  const { data: existing } = await q.single()
  if (!existing) throw new Error('Request not found')
  if (opts.token !== undefined && opts.token !== existing.decision_token) throw new Error('Invalid token')
  if (existing.status !== 'pending') throw new Error(`Request already ${existing.status}`)

  const { data: row, error } = await supabase
    .from('budget_requests')
    .update({ status: action === 'approve' ? 'approved' : 'denied', decided_at: new Date().toISOString(), decided_by: decidedBy })
    .eq('id', requestId)
    .eq('status', 'pending')
    .select(SELECT)
    .single()
  if (error || !row) throw new Error(error?.message ?? 'Failed to decide')

  if (action === 'approve') {
    await supabase.from('projects').update({ monthly_budget_usd: row.requested_budget_usd }).eq('id', row.project_id)
  }

  const { data: project } = await supabase.from('projects').select('name, clients(name)').eq('id', row.project_id).single()
  const label = `${(project as unknown as { clients: { name: string } | null } | null)?.clients?.name ?? ''} / ${project?.name ?? ''}`
  await raiseAlert(supabase, {
    agency_id: row.agency_id,
    kind: 'budget_decided',
    scope: 'request',
    scope_id: row.id,
    title: `Budget request for "${label}" ${action === 'approve' ? `approved: $${Number(row.requested_budget_usd).toFixed(2)}/month` : 'denied'}`,
    body: `Decided via ${decidedBy}.`,
    data: { request_id: row.id, links: { 'Open project': `${opts.origin}/dashboard/projects/${row.project_id}` } },
  })

  return row as BudgetRequestRow
}
