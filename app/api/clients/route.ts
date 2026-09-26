import { NextRequest, NextResponse } from 'next/server'
import { getSessionContext, unauthorizedResponse, periodBounds } from '@/lib/agency'

// GET /api/clients — all clients with project count and month spend
export async function GET(req: NextRequest) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  const { supabase, agencyId } = ctx
  const { monthStart } = periodBounds()

  const [{ data: clients, error }, { data: projects }, { data: monthCalls }] = await Promise.all([
    supabase
      .from('clients')
      .select('id, name, rebill_markup_pct, monthly_budget_usd, is_active, created_at')
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false }),
    supabase.from('projects').select('id, client_id, is_active').eq('agency_id', agencyId),
    supabase.from('api_calls').select('client_id, cost_usd').eq('agency_id', agencyId).gte('created_at', monthStart),
  ])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const projectCount: Record<string, number> = {}
  for (const p of projects ?? []) {
    if (p.is_active) projectCount[p.client_id] = (projectCount[p.client_id] ?? 0) + 1
  }
  const spend: Record<string, number> = {}
  for (const c of monthCalls ?? []) {
    spend[c.client_id] = (spend[c.client_id] ?? 0) + Number(c.cost_usd)
  }

  return NextResponse.json(
    (clients ?? []).map(c => ({
      ...c,
      project_count: projectCount[c.id] ?? 0,
      month_spend_usd: spend[c.id] ?? 0,
    }))
  )
}

// POST /api/clients — create a client
export async function POST(req: NextRequest) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  const { supabase, agencyId } = ctx

  const body = await req.json()
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('clients')
    .insert({
      agency_id: agencyId,
      name,
      rebill_markup_pct: Number(body.rebill_markup_pct ?? 0) || 0,
      monthly_budget_usd: body.monthly_budget_usd ? Number(body.monthly_budget_usd) : null,
    })
    .select('id, name, rebill_markup_pct, monthly_budget_usd, is_active, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ...data, project_count: 0, month_spend_usd: 0 }, { status: 201 })
}
