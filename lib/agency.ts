import type { SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { hashProjectKey, isAgencyKey } from '@/lib/keys'

export interface SessionContext {
  supabase: SupabaseClient
  userId: string | null       // null when authenticated with an agency key
  agencyId: string
  via: 'session' | 'agency_key'
}

// Resolve who is acting and on which agency.
// 1. Authorization: Bearer kone_admin_… → agency key (agents, MCP, scripts)
// 2. otherwise the signed-in user's cookie session (dashboard)
export async function getSessionContext(req?: Request): Promise<SessionContext | null> {
  const bearer = req?.headers.get('authorization') ?? ''
  const token = bearer.startsWith('Bearer ') ? bearer.slice(7).trim() : ''

  if (token && isAgencyKey(token)) {
    const supabase = createServiceClient()
    const { data: key } = await supabase
      .from('agency_keys')
      .select('id, agency_id, revoked_at')
      .eq('key_hash', hashProjectKey(token))
      .maybeSingle()
    if (!key || key.revoked_at) return null

    void supabase
      .from('agency_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', key.id)
      .then(() => undefined, () => undefined)

    return { supabase, userId: null, agencyId: key.agency_id, via: 'agency_key' }
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: membership } = await supabase
    .from('agency_members')
    .select('agency_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (!membership) return null

  return { supabase, userId: user.id, agencyId: membership.agency_id, via: 'session' }
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// Month and day boundaries used by every spend query
export function periodBounds(now = new Date()) {
  return {
    monthStart: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
    dayStart: new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString(),
  }
}
