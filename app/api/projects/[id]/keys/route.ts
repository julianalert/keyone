import { NextRequest, NextResponse } from 'next/server'
import { getSessionContext, unauthorizedResponse } from '@/lib/agency'
import { generateProjectKey } from '@/lib/keys'

type Params = { params: { id: string } }

// GET /api/projects/:id/keys — list keys (never the hash)
export async function GET(req: NextRequest, { params }: Params) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  const { supabase, agencyId } = ctx

  const { data, error } = await supabase
    .from('project_keys')
    .select('id, name, key_prefix, last_used_at, revoked_at, created_at')
    .eq('project_id', params.id)
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST /api/projects/:id/keys — mint a new key. Pass { revoke_others: true }
// to rotate: the new key is issued and every other active key is revoked.
export async function POST(req: NextRequest, { params }: Params) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  const { supabase, agencyId } = ctx

  const body = await req.json().catch(() => ({}))
  const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : 'default'

  const { data: project } = await supabase
    .from('projects')
    .select('id, is_active')
    .eq('id', params.id)
    .eq('agency_id', agencyId)
    .single()
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const key = generateProjectKey()
  const { data, error } = await supabase
    .from('project_keys')
    .insert({ project_id: params.id, agency_id: agencyId, name, key_hash: key.hash, key_prefix: key.prefix })
    .select('id, name, key_prefix, last_used_at, revoked_at, created_at')
    .single()

  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Failed' }, { status: 500 })

  if (body.revoke_others === true) {
    await supabase
      .from('project_keys')
      .update({ revoked_at: new Date().toISOString() })
      .eq('project_id', params.id)
      .eq('agency_id', agencyId)
      .is('revoked_at', null)
      .neq('id', data.id)
  }

  return NextResponse.json({ ...data, api_key: key.plaintext }, { status: 201 })
}
