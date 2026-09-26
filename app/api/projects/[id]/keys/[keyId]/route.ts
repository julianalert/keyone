import { NextRequest, NextResponse } from 'next/server'
import { getSessionContext, unauthorizedResponse } from '@/lib/agency'

type Params = { params: { id: string; keyId: string } }

// DELETE /api/projects/:id/keys/:keyId — revoke a key. Irreversible.
export async function DELETE(req: NextRequest, { params }: Params) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  const { supabase, agencyId } = ctx

  const { data, error } = await supabase
    .from('project_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', params.keyId)
    .eq('project_id', params.id)
    .eq('agency_id', agencyId)
    .is('revoked_at', null)
    .select('id')
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Key not found or already revoked' }, { status: 404 })
  return NextResponse.json({ success: true })
}

// PATCH /api/projects/:id/keys/:keyId  { frozen: false } — unfreeze after a spike
export async function PATCH(req: NextRequest, { params }: Params) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  const body = await req.json().catch(() => ({}))
  if (body.frozen !== false) return NextResponse.json({ error: 'Only { "frozen": false } is supported' }, { status: 400 })

  const { data, error } = await ctx.supabase
    .from('project_keys')
    .update({ frozen_at: null, frozen_reason: null })
    .eq('id', params.keyId)
    .eq('project_id', params.id)
    .eq('agency_id', ctx.agencyId)
    .select('id, name, key_prefix, last_used_at, revoked_at, created_at')
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Key not found' }, { status: 404 })
  return NextResponse.json({ ...data, frozen_at: null, frozen_reason: null })
}
