import { NextRequest, NextResponse } from 'next/server'
import { getSessionContext, unauthorizedResponse } from '@/lib/agency'

// GET /api/analytics/timeline?project_id=&client_id=&days=30
export async function GET(req: NextRequest) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  const { supabase, agencyId } = ctx

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('project_id')
  const clientId = searchParams.get('client_id')
  const days = Math.min(90, Math.max(7, Number(searchParams.get('days') ?? 30)))

  const since = new Date()
  since.setDate(since.getDate() - days)

  let query = supabase
    .from('api_calls')
    .select('cost_usd, created_at')
    .eq('agency_id', agencyId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true })

  if (projectId) query = query.eq('project_id', projectId)
  if (clientId) query = query.eq('client_id', clientId)

  const { data: calls } = await query

  const byDay: Record<string, number> = {}
  for (let i = 0; i < days; i++) {
    const d = new Date(since)
    d.setDate(d.getDate() + i)
    byDay[d.toISOString().slice(0, 10)] = 0
  }
  for (const call of calls ?? []) {
    const day = call.created_at.slice(0, 10)
    byDay[day] = (byDay[day] ?? 0) + Number(call.cost_usd)
  }

  const timeline = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, spend_usd]) => ({ date, spend_usd }))

  return NextResponse.json({ timeline })
}
