import { NextRequest, NextResponse } from 'next/server'
import { getSessionContext, unauthorizedResponse } from '@/lib/agency'
import { createBudgetRequest } from '@/lib/requests'

type Params = { params: { id: string } }

// GET /api/projects/:id/requests
export async function GET(req: NextRequest, { params }: Params) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  const { data, error } = await ctx.supabase
    .from('budget_requests')
    .select('id, requested_by, current_budget_usd, requested_budget_usd, reason, status, auto_approved, decided_at, decided_by, created_at')
    .eq('project_id', params.id)
    .eq('agency_id', ctx.agencyId)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST /api/projects/:id/requests — a user or agency-key agent files one
export async function POST(req: NextRequest, { params }: Params) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  const body = await req.json().catch(() => ({}))
  try {
    const row = await createBudgetRequest(ctx.supabase, {
      agency_id: ctx.agencyId,
      project_id: params.id,
      requested_by: ctx.via === 'session' ? 'user' : 'agent',
      requested_budget_usd: Number(body.requested_budget_usd),
      reason: typeof body.reason === 'string' ? body.reason.slice(0, 500) : undefined,
      origin: new URL(req.url).origin,
    })
    return NextResponse.json(row, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 400 })
  }
}
