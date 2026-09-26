import { NextRequest, NextResponse } from 'next/server'
import { getSessionContext, unauthorizedResponse } from '@/lib/agency'

// GET /api/alerts?unread=1&limit=20
export async function GET(req: NextRequest) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  const sp = new URL(req.url).searchParams
  const limit = Math.min(100, Number(sp.get('limit') ?? 20))

  let q = ctx.supabase
    .from('alerts')
    .select('id, kind, scope, scope_id, title, body, data, delivered_email, delivered_webhook, read_at, created_at')
    .eq('agency_id', ctx.agencyId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (sp.get('unread')) q = q.is('read_at', null)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
