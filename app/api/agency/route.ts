import { NextRequest, NextResponse } from 'next/server'
import { getSessionContext, unauthorizedResponse } from '@/lib/agency'

// GET /api/agency — who am I (works with a cookie session or an agency key)
export async function GET(req: NextRequest) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  const { supabase, agencyId } = ctx

  const [{ data: agency }, { data: wallet }] = await Promise.all([
    supabase.from('agencies').select('id, name, created_at, alert_email, webhook_url, spike_multiplier, spike_floor_usd, auto_approve_increase_usd, owner:users!agencies_owner_user_id_fkey(email)').eq('id', agencyId).single(),
    supabase.from('wallets').select('balance_usd').eq('agency_id', agencyId).single(),
  ])

  const { owner, ...rest } = (agency ?? {}) as Record<string, unknown> & { owner?: { email: string } | { email: string }[] | null }
  const ownerEmail = Array.isArray(owner) ? owner[0]?.email : owner?.email
  return NextResponse.json({ ...rest, owner_email: ownerEmail ?? null, wallet_balance_usd: Number(wallet?.balance_usd ?? 0), auth: ctx.via })
}

// PATCH /api/agency — name and control settings. Dashboard session only.
export async function PATCH(req: NextRequest) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  if (ctx.via !== 'session') return NextResponse.json({ error: 'Agency settings can only be changed from the dashboard' }, { status: 403 })
  const body = await req.json()

  const updates: Record<string, unknown> = {}
  if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim()
  if (body.alert_email !== undefined) updates.alert_email = body.alert_email ? String(body.alert_email).trim() : null
  if (body.webhook_url !== undefined) {
    const u = body.webhook_url ? String(body.webhook_url).trim() : ''
    if (u && !/^https?:\/\//.test(u)) return NextResponse.json({ error: 'webhook_url must be http(s)' }, { status: 400 })
    updates.webhook_url = u || null
  }
  for (const k of ['spike_multiplier', 'spike_floor_usd', 'auto_approve_increase_usd'] as const) {
    if (body[k] !== undefined) {
      const n = Number(body[k])
      if (!Number.isFinite(n) || n < 0) return NextResponse.json({ error: `${k} must be a non-negative number` }, { status: 400 })
      updates[k] = n
    }
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  const { data, error } = await ctx.supabase
    .from('agencies')
    .update(updates)
    .eq('id', ctx.agencyId)
    .select('id, name, alert_email, webhook_url, spike_multiplier, spike_floor_usd, auto_approve_increase_usd')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
