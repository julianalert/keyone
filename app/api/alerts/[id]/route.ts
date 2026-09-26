import { NextRequest, NextResponse } from 'next/server'
import { getSessionContext, unauthorizedResponse } from '@/lib/agency'

// PATCH /api/alerts/:id — mark read. Use id "all" to mark everything read.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  let q = ctx.supabase.from('alerts').update({ read_at: new Date().toISOString() }).eq('agency_id', ctx.agencyId).is('read_at', null)
  if (params.id !== 'all') q = q.eq('id', params.id)
  const { error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
