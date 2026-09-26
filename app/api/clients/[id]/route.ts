import { NextRequest, NextResponse } from 'next/server'
import { getSessionContext, unauthorizedResponse, periodBounds } from '@/lib/agency'

type Params = { params: { id: string } }

// GET /api/clients/:id — client with month spend
export async function GET(req: NextRequest, { params }: Params) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  const { supabase, agencyId } = ctx
  const { monthStart } = periodBounds()

  const { data: client } = await supabase
    .from('clients')
    .select('id, name, rebill_markup_pct, monthly_budget_usd, is_active, created_at')
    .eq('id', params.id)
    .eq('agency_id', agencyId)
    .single()

  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: monthCalls } = await supabase
    .from('api_calls')
    .select('cost_usd')
    .eq('client_id', params.id)
    .gte('created_at', monthStart)

  const monthSpend = (monthCalls ?? []).reduce((s, c) => s + Number(c.cost_usd), 0)

  return NextResponse.json({ ...client, month_spend_usd: monthSpend })
}

// PATCH /api/clients/:id — update name, markup, budget, active flag
export async function PATCH(req: NextRequest, { params }: Params) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  const { supabase, agencyId } = ctx

  const body = await req.json()
  const updates: Record<string, unknown> = {}
  if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim()
  if (body.rebill_markup_pct !== undefined) updates.rebill_markup_pct = Number(body.rebill_markup_pct) || 0
  if (body.monthly_budget_usd !== undefined) {
    updates.monthly_budget_usd = body.monthly_budget_usd === null ? null : Number(body.monthly_budget_usd)
  }
  if (typeof body.is_active === 'boolean') updates.is_active = body.is_active

  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', params.id)
    .eq('agency_id', agencyId)
    .select('id, name, rebill_markup_pct, monthly_budget_usd, is_active, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/clients/:id — deactivate the client and all its projects
export async function DELETE(req: NextRequest, { params }: Params) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  const { supabase, agencyId } = ctx

  const { error } = await supabase
    .from('clients')
    .update({ is_active: false })
    .eq('id', params.id)
    .eq('agency_id', agencyId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('projects').update({ is_active: false }).eq('client_id', params.id).eq('agency_id', agencyId)

  return NextResponse.json({ success: true })
}
