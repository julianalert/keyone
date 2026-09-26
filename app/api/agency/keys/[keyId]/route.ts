import { NextRequest, NextResponse } from 'next/server'
import { getSessionContext, unauthorizedResponse } from '@/lib/agency'

// DELETE /api/agency/keys/:keyId — revoke. Dashboard session only.
export async function DELETE(req: NextRequest, { params }: { params: { keyId: string } }) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  if (ctx.via !== 'session') {
    return NextResponse.json({ error: 'Agency keys can only be revoked from the dashboard' }, { status: 403 })
  }

  const { data, error } = await ctx.supabase
    .from('agency_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', params.keyId)
    .eq('agency_id', ctx.agencyId)
    .is('revoked_at', null)
    .select('id')
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Key not found or already revoked' }, { status: 404 })
  return NextResponse.json({ success: true })
}
