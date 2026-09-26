import { NextRequest, NextResponse } from 'next/server'
import { getSessionContext, unauthorizedResponse, periodBounds } from '@/lib/agency'
import { generateProjectKey } from '@/lib/keys'

type Params = { params: { id: string } }

// GET /api/clients/:id/projects — projects for a client with month spend
export async function GET(req: NextRequest, { params }: Params) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  const { supabase, agencyId } = ctx
  const { monthStart } = periodBounds()

  const [{ data: projects, error }, { data: monthCalls }, { data: keys }] = await Promise.all([
    supabase
      .from('projects')
      .select('id, client_id, name, monthly_budget_usd, is_active, created_at')
      .eq('client_id', params.id)
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false }),
    supabase.from('api_calls').select('project_id, cost_usd').eq('client_id', params.id).gte('created_at', monthStart),
    supabase.from('project_keys').select('project_id, key_prefix, revoked_at').eq('agency_id', agencyId),
  ])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const spend: Record<string, number> = {}
  for (const c of monthCalls ?? []) spend[c.project_id] = (spend[c.project_id] ?? 0) + Number(c.cost_usd)

  const activeKeyPrefix: Record<string, string> = {}
  for (const k of keys ?? []) if (!k.revoked_at) activeKeyPrefix[k.project_id] = k.key_prefix

  return NextResponse.json(
    (projects ?? []).map(p => ({
      ...p,
      month_spend_usd: spend[p.id] ?? 0,
      key_prefix: activeKeyPrefix[p.id] ?? null,
    }))
  )
}

// POST /api/clients/:id/projects — create a project and mint its key.
// The plaintext key is returned once and never stored.
export async function POST(req: NextRequest, { params }: Params) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  const { supabase, agencyId } = ctx

  const body = await req.json()
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const { data: client } = await supabase
    .from('clients')
    .select('id, is_active')
    .eq('id', params.id)
    .eq('agency_id', agencyId)
    .single()
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  if (!client.is_active) return NextResponse.json({ error: 'Client is inactive' }, { status: 400 })

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      client_id: params.id,
      agency_id: agencyId,
      name,
      monthly_budget_usd: body.monthly_budget_usd ? Number(body.monthly_budget_usd) : null,
    })
    .select('id, client_id, name, monthly_budget_usd, is_active, created_at')
    .single()

  if (error || !project) return NextResponse.json({ error: error?.message ?? 'Failed' }, { status: 500 })

  const key = generateProjectKey()
  const { error: keyError } = await supabase.from('project_keys').insert({
    project_id: project.id,
    agency_id: agencyId,
    name: 'default',
    key_hash: key.hash,
    key_prefix: key.prefix,
  })

  if (keyError) return NextResponse.json({ error: keyError.message }, { status: 500 })

  return NextResponse.json(
    { ...project, month_spend_usd: 0, key_prefix: key.prefix, api_key: key.plaintext },
    { status: 201 }
  )
}
