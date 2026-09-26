import { NextRequest, NextResponse } from 'next/server'
import { getSessionContext, unauthorizedResponse } from '@/lib/agency'
import { createServiceClient } from '@/lib/supabase/server'

type Params = { params: { userId: string } }

async function callerRole(agencyId: string, userId: string | null) {
  if (!userId) return null
  const { data } = await createServiceClient().from('agency_members').select('role').eq('agency_id', agencyId).eq('user_id', userId).maybeSingle()
  return data?.role ?? null
}

// PATCH /api/agency/members/:userId { role } — change a role (owner/admin only; owner can't be changed)
export async function PATCH(req: NextRequest, { params }: Params) {
  const ctx = await getSessionContext(req)
  if (!ctx || ctx.via !== 'session') return unauthorizedResponse()
  const me = await callerRole(ctx.agencyId, ctx.userId)
  if (me !== 'owner' && me !== 'admin') return NextResponse.json({ error: 'Only owners and admins can change roles' }, { status: 403 })
  const body = await req.json().catch(() => ({}))
  const role = body.role === 'admin' ? 'admin' : body.role === 'member' ? 'member' : null
  if (!role) return NextResponse.json({ error: 'role must be admin or member' }, { status: 400 })

  const admin = createServiceClient()
  const { data: target } = await admin.from('agency_members').select('role').eq('agency_id', ctx.agencyId).eq('user_id', params.userId).maybeSingle()
  if (!target) return NextResponse.json({ error: 'Not a member' }, { status: 404 })
  if (target.role === 'owner') return NextResponse.json({ error: "The owner's role can't be changed" }, { status: 400 })

  const { error } = await admin.from('agency_members').update({ role }).eq('agency_id', ctx.agencyId).eq('user_id', params.userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, role })
}

// DELETE /api/agency/members/:userId — remove from the team (owner/admin; never the owner)
export async function DELETE(req: NextRequest, { params }: Params) {
  const ctx = await getSessionContext(req)
  if (!ctx || ctx.via !== 'session') return unauthorizedResponse()
  const me = await callerRole(ctx.agencyId, ctx.userId)
  if (me !== 'owner' && me !== 'admin') return NextResponse.json({ error: 'Only owners and admins can remove members' }, { status: 403 })

  const admin = createServiceClient()
  const { data: target } = await admin.from('agency_members').select('role').eq('agency_id', ctx.agencyId).eq('user_id', params.userId).maybeSingle()
  if (!target) return NextResponse.json({ error: 'Not a member' }, { status: 404 })
  if (target.role === 'owner') return NextResponse.json({ error: "The owner can't be removed" }, { status: 400 })

  const { error } = await admin.from('agency_members').delete().eq('agency_id', ctx.agencyId).eq('user_id', params.userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
