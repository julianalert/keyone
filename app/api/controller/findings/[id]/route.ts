import { NextRequest, NextResponse } from 'next/server'
import { getSessionContext, unauthorizedResponse } from '@/lib/agency'
import { createServiceClient } from '@/lib/supabase/server'
import { applyAction } from '@/lib/controller/run'
import type { Action } from '@/lib/controller/analyze'

// PATCH /api/controller/findings/:id  { action: "apply" | "dismiss" }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  const body = await req.json().catch(() => ({}))
  const what = body.action === 'apply' ? 'apply' : body.action === 'dismiss' ? 'dismiss' : null
  if (!what) return NextResponse.json({ error: 'action must be apply or dismiss' }, { status: 400 })

  const { data: finding } = await ctx.supabase
    .from('controller_findings')
    .select('id, status, action')
    .eq('id', params.id)
    .eq('agency_id', ctx.agencyId)
    .single()
  if (!finding) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (finding.status !== 'proposed') return NextResponse.json({ error: `Already ${finding.status}` }, { status: 400 })

  let result = 'Dismissed'
  if (what === 'apply') {
    if (!finding.action) return NextResponse.json({ error: 'This finding has no proposal to apply' }, { status: 400 })
    try {
      result = await applyAction(createServiceClient(), ctx.agencyId, finding.action as Action, new URL(req.url).origin)
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 400 })
    }
  }

  const { data, error } = await ctx.supabase
    .from('controller_findings')
    .update({ status: what === 'apply' ? 'applied' : 'dismissed', decided_at: new Date().toISOString(), decided_by: ctx.via === 'session' ? 'dashboard' : 'mcp' })
    .eq('id', params.id)
    .select('id, status, decided_at')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ...data, result })
}
