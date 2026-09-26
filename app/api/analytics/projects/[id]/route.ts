import { NextRequest, NextResponse } from 'next/server'
import { getSessionContext, unauthorizedResponse, periodBounds } from '@/lib/agency'

// GET /api/analytics/projects/:id — recent calls and month spend by API
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  const { supabase, agencyId } = ctx
  const { monthStart } = periodBounds()

  const { data: project } = await supabase
    .from('projects')
    .select('id, name')
    .eq('id', params.id)
    .eq('agency_id', agencyId)
    .single()
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [{ data: calls }, { data: monthCalls }] = await Promise.all([
    supabase
      .from('api_calls')
      .select('id, catalog_api_id, cost_usd, response_status, duration_ms, created_at, model, input_tokens, output_tokens, status, blocked_reason')
      .eq('project_id', params.id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('api_calls').select('cost_usd, catalog_api_id').eq('project_id', params.id).gte('created_at', monthStart),
  ])

  const apiSpend: Record<string, number> = {}
  let monthSpend = 0
  for (const call of monthCalls ?? []) {
    const cost = Number(call.cost_usd)
    monthSpend += cost
    apiSpend[call.catalog_api_id] = (apiSpend[call.catalog_api_id] ?? 0) + cost
  }

  return NextResponse.json({ project, month_spend_usd: monthSpend, recent_calls: calls ?? [], spend_by_api: apiSpend })
}
