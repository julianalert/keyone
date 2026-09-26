import { NextRequest, NextResponse } from 'next/server'
import { getSessionContext, unauthorizedResponse, periodBounds } from '@/lib/agency'

type Params = { params: { id: string } }

// GET /api/projects/:id — project, its client, keys, and stats
export async function GET(req: NextRequest, { params }: Params) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  const { supabase, agencyId } = ctx
  const { monthStart, dayStart } = periodBounds()

  const { data: project } = await supabase
    .from('projects')
    .select('id, client_id, name, monthly_budget_usd, max_cost_per_call_usd, allowed_apis, allowed_models, is_active, created_at, clients(id, name)')
    .eq('id', params.id)
    .eq('agency_id', agencyId)
    .single()

  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [{ data: monthCalls }, { count: todayCount }, { data: keys }, { count: blockedCount }] = await Promise.all([
    supabase.from('api_calls').select('cost_usd').eq('project_id', params.id).gte('created_at', monthStart),
    supabase.from('api_calls').select('id', { count: 'exact', head: true }).eq('project_id', params.id).gte('created_at', dayStart),
    supabase
      .from('project_keys')
      .select('id, name, key_prefix, last_used_at, revoked_at, frozen_at, frozen_reason, created_at')
      .eq('project_id', params.id)
      .order('created_at', { ascending: false }),
    supabase.from('api_calls').select('id', { count: 'exact', head: true }).eq('project_id', params.id).eq('status', 'blocked').gte('created_at', monthStart),
  ])

  const { clients, ...rest } = project as typeof project & { clients: { id: string; name: string } | null }
  const monthSpend = (monthCalls ?? []).reduce((s, c) => s + Number(c.cost_usd), 0)

  return NextResponse.json({
    ...rest,
    client: clients,
    month_spend_usd: monthSpend,
    today_calls: todayCount ?? 0,
    blocked_this_month: blockedCount ?? 0,
    keys: keys ?? [],
  })
}

// PATCH /api/projects/:id — update name, budget, active flag
export async function PATCH(req: NextRequest, { params }: Params) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  const { supabase, agencyId } = ctx

  const body = await req.json()
  const updates: Record<string, unknown> = {}
  if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim()
  if (body.monthly_budget_usd !== undefined) {
    updates.monthly_budget_usd = body.monthly_budget_usd === null ? null : Number(body.monthly_budget_usd)
  }
  if (body.max_cost_per_call_usd !== undefined) {
    updates.max_cost_per_call_usd = body.max_cost_per_call_usd === null ? null : Number(body.max_cost_per_call_usd)
  }
  if (body.allowed_apis !== undefined) {
    // null or [] means every tool in the catalog
    updates.allowed_apis = Array.isArray(body.allowed_apis) && body.allowed_apis.length > 0
      ? body.allowed_apis.filter((s: unknown) => typeof s === 'string')
      : null
  }
  if (body.allowed_models !== undefined) {
    updates.allowed_models = Array.isArray(body.allowed_models) && body.allowed_models.length > 0
      ? body.allowed_models.filter((s: unknown) => typeof s === 'string' && s.trim()).map((s: string) => s.trim())
      : null
  }
  if (typeof body.is_active === 'boolean') updates.is_active = body.is_active

  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', params.id)
    .eq('agency_id', agencyId)
    .select('id, client_id, name, monthly_budget_usd, max_cost_per_call_usd, allowed_apis, allowed_models, is_active, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/projects/:id — deactivate (keys stop working immediately)
export async function DELETE(req: NextRequest, { params }: Params) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  const { supabase, agencyId } = ctx

  const { error } = await supabase
    .from('projects')
    .update({ is_active: false })
    .eq('id', params.id)
    .eq('agency_id', agencyId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
