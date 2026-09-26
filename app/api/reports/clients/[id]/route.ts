import { NextRequest, NextResponse } from 'next/server'
import { getSessionContext, unauthorizedResponse } from '@/lib/agency'
import { parseRange, clientBreakdown, pivot, totals, dailySeries } from '@/lib/reports'

// GET /api/reports/clients/:id?range=this_month|last_month  or ?from=&to=
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  const range = parseRange(new URL(req.url).searchParams)

  const { data: client } = await ctx.supabase
    .from('clients')
    .select('id, name, rebill_markup_pct')
    .eq('id', params.id)
    .eq('agency_id', ctx.agencyId)
    .single()
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const markup = Number(client.rebill_markup_pct ?? 0)
    const [rows, daily] = await Promise.all([
      clientBreakdown(ctx.supabase, params.id, range),
      dailySeries(ctx.supabase, 'client', params.id, range),
    ])
    return NextResponse.json({
      client: { id: client.id, name: client.name, rebill_markup_pct: markup },
      range,
      totals: totals(rows, markup),
      by_project: pivot(rows, 'project', markup),
      by_tool: pivot(rows, 'tool', markup),
      by_model: pivot(rows, 'model', markup),
      daily,
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
