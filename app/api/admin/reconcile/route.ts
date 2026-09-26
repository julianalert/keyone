import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isPlatformAdmin } from '@/lib/platform'
import { runReconciliation } from '@/lib/reconcile/run'

export const runtime = 'nodejs'
export const maxDuration = 120

// POST /api/admin/reconcile?days=3 — platform admins only
export async function POST(req: NextRequest) {
  const { data: { user } } = await createClient().auth.getUser()
  if (!user || !isPlatformAdmin(user.email)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const days = Math.min(31, Math.max(1, Number(new URL(req.url).searchParams.get('days') ?? 3)))
  try {
    return NextResponse.json(await runReconciliation(createServiceClient(), days, new URL(req.url).origin))
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
