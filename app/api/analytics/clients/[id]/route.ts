import { NextRequest, NextResponse } from 'next/server'
import { getSessionContext, unauthorizedResponse, periodBounds } from '@/lib/agency'

// GET /api/analytics/clients/:id — month spend by project and by API for a client
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  const { supabase, agencyId } = ctx
  const { monthStart } = periodBounds()

  const { data: client } = await supabase
    .from('clients')
    .select('id, name, rebill_markup_pct')
    .eq('id', params.id)
    .eq('agency_id', agencyId)
    .single()
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: monthCalls } = await supabase
    .from('api_calls')
    .select('cost_usd, project_id, catalog_api_id')
    .eq('client_id', params.id)
    .gte('created_at', monthStart)

  const byProject: Record<string, number> = {}
  const byApi: Record<string, number> = {}
  let monthSpend = 0
  for (const call of monthCalls ?? []) {
    const cost = Number(call.cost_usd)
    monthSpend += cost
    byProject[call.project_id] = (byProject[call.project_id] ?? 0) + cost
    byApi[call.catalog_api_id] = (byApi[call.catalog_api_id] ?? 0) + cost
  }

  const markup = Number(client.rebill_markup_pct ?? 0)
  return NextResponse.json({
    client,
    month_spend_usd: monthSpend,
    month_rebill_usd: monthSpend * (1 + markup / 100),
    spend_by_project: byProject,
    spend_by_api: byApi,
  })
}
