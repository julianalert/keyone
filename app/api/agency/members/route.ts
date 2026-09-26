import { NextRequest, NextResponse } from 'next/server'
import { getSessionContext, unauthorizedResponse } from '@/lib/agency'
import { createServiceClient } from '@/lib/supabase/server'
import { appUrl } from '@/lib/config'

const ROLES = ['admin', 'member'] as const

async function myRole(ctx: { supabase: import('@supabase/supabase-js').SupabaseClient; userId: string | null; agencyId: string }): Promise<string | null> {
  if (!ctx.userId) return null
  const { data } = await ctx.supabase.from('agency_members').select('role').eq('agency_id', ctx.agencyId).eq('user_id', ctx.userId).maybeSingle()
  return data?.role ?? null
}

// GET /api/agency/members — the team
export async function GET(req: NextRequest) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  const { data, error } = await ctx.supabase
    .from('agency_members')
    .select('user_id, role, created_at, users(email)')
    .eq('agency_id', ctx.agencyId)
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(
    (data ?? []).map(r => {
      const u = r.users as { email: string } | { email: string }[] | null
      return { user_id: r.user_id, role: r.role, joined_at: r.created_at, email: (Array.isArray(u) ? u[0]?.email : u?.email) ?? null, is_you: r.user_id === ctx.userId }
    })
  )
}

// POST /api/agency/members { email, role } — invite. Owners and admins, dashboard only.
export async function POST(req: NextRequest) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  if (ctx.via !== 'session') return NextResponse.json({ error: 'Invites can only be sent from the dashboard' }, { status: 403 })
  const role = await myRole(ctx)
  if (role !== 'owner' && role !== 'admin') return NextResponse.json({ error: 'Only owners and admins can invite' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const invitedRole = ROLES.includes(body.role) ? body.role : 'member'
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })

  const admin = createServiceClient()
  const { data: agency } = await admin.from('agencies').select('name').eq('id', ctx.agencyId).single()

  // Already a key.one user? Add them straight to the team.
  const { data: existing } = await admin.from('users').select('id').eq('email', email).maybeSingle()
  if (existing) {
    const { error } = await admin.from('agency_members').upsert({ agency_id: ctx.agencyId, user_id: existing.id, role: invitedRole }, { onConflict: 'agency_id,user_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ status: 'added', email, role: invitedRole })
  }

  // New person: Supabase sends the invite; the signup trigger attaches them to this agency.
  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { invited_agency_id: ctx.agencyId, invited_role: invitedRole, agency_name: agency?.name ?? '' },
    redirectTo: `${appUrl(new URL(req.url).origin)}/auth/callback?next=/set-password`,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ status: 'invited', email, role: invitedRole })
}
