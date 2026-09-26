import { NextRequest, NextResponse } from 'next/server'
import { getSessionContext, unauthorizedResponse } from '@/lib/agency'
import { decideBudgetRequest } from '@/lib/requests'

// PATCH /api/requests/:id  { action: "approve" | "deny" }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  const body = await req.json().catch(() => ({}))
  const action = body.action === 'approve' ? 'approve' : body.action === 'deny' ? 'deny' : null
  if (!action) return NextResponse.json({ error: 'action must be approve or deny' }, { status: 400 })
  try {
    const row = await decideBudgetRequest(ctx.supabase, params.id, action, ctx.via === 'session' ? 'dashboard' : 'mcp', {
      agency_id: ctx.agencyId,
      origin: new URL(req.url).origin,
    })
    return NextResponse.json(row)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 400 })
  }
}
