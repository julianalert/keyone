import { NextRequest, NextResponse } from 'next/server'
import { getSessionContext, unauthorizedResponse } from '@/lib/agency'
import { generateAgencyKey } from '@/lib/keys'

// GET /api/agency/keys — list agency (management) keys
export async function GET(req: NextRequest) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()

  const { data, error } = await ctx.supabase
    .from('agency_keys')
    .select('id, name, key_prefix, last_used_at, revoked_at, created_at')
    .eq('agency_id', ctx.agencyId)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST /api/agency/keys — mint one. Dashboard session only: an agency key
// must not be able to mint more agency keys.
export async function POST(req: NextRequest) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  if (ctx.via !== 'session') {
    return NextResponse.json({ error: 'Agency keys can only be created from the dashboard' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : 'default'
  const key = generateAgencyKey()

  const { data, error } = await ctx.supabase
    .from('agency_keys')
    .insert({ agency_id: ctx.agencyId, name, key_hash: key.hash, key_prefix: key.prefix })
    .select('id, name, key_prefix, last_used_at, revoked_at, created_at')
    .single()
  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Failed' }, { status: 500 })

  return NextResponse.json({ ...data, api_key: key.plaintext }, { status: 201 })
}
