import { NextRequest, NextResponse } from 'next/server'
import { getSessionContext, unauthorizedResponse } from '@/lib/agency'

// GET /api/requests?status=pending — agency-wide budget requests
export async function GET(req: NextRequest) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  const status = new URL(req.url).searchParams.get('status')

  let q = ctx.supabase
    .from('budget_requests')
    .select('id, project_id, requested_by, current_budget_usd, requested_budget_usd, reason, status, auto_approved, decided_at, decided_by, created_at, projects(name, clients(name))')
    .eq('agency_id', ctx.agencyId)
    .order('created_at', { ascending: false })
    .limit(100)
  if (status) q = q.eq('status', status)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(
    (data ?? []).map(r => {
      const { projects, ...rest } = r as typeof r & { projects: { name: string; clients: { name: string } | null } | null }
      return { ...rest, project_name: projects?.name ?? null, client_name: projects?.clients?.name ?? null }
    })
  )
}
