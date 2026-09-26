import { NextRequest, NextResponse } from 'next/server'
import { getSessionContext, unauthorizedResponse, periodBounds } from '@/lib/agency'

// GET /api/analytics/overview — agency-wide numbers for the dashboard
export async function GET(req: NextRequest) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  const { supabase, agencyId } = ctx
  const { monthStart, dayStart } = periodBounds()

  const [walletRes, monthCallsRes, todayRes, clientsRes, projectsRes] = await Promise.all([
    supabase.from('wallets').select('balance_usd').eq('agency_id', agencyId).single(),
    supabase.from('api_calls').select('cost_usd, client_id, project_id').eq('agency_id', agencyId).gte('created_at', monthStart),
    supabase.from('api_calls').select('id', { count: 'exact', head: true }).eq('agency_id', agencyId).gte('created_at', dayStart),
    supabase.from('clients').select('id, name').eq('agency_id', agencyId).eq('is_active', true),
    supabase.from('projects').select('id, name').eq('agency_id', agencyId).eq('is_active', true),
  ])

  const monthCalls = monthCallsRes.data ?? []
  const clientSpend: Record<string, number> = {}
  const projectSpend: Record<string, number> = {}
  let monthSpend = 0
  for (const call of monthCalls) {
    const cost = Number(call.cost_usd)
    monthSpend += cost
    clientSpend[call.client_id] = (clientSpend[call.client_id] ?? 0) + cost
    projectSpend[call.project_id] = (projectSpend[call.project_id] ?? 0) + cost
  }

  const top = (spend: Record<string, number>, rows: { id: string; name: string }[] | null) => {
    const id = Object.entries(spend).sort(([, a], [, b]) => b - a)[0]?.[0]
    const row = rows?.find(r => r.id === id)
    return row ? { id: row.id, name: row.name, spend_usd: spend[row.id] } : null
  }

  return NextResponse.json({
    balance_usd: Number(walletRes.data?.balance_usd ?? 0),
    month_spend_usd: monthSpend,
    today_calls: todayRes.count ?? 0,
    active_clients: clientsRes.data?.length ?? 0,
    active_projects: projectsRes.data?.length ?? 0,
    top_client: top(clientSpend, clientsRes.data),
    top_project: top(projectSpend, projectsRes.data),
  })
}
