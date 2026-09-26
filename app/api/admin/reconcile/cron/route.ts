import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { runReconciliation } from '@/lib/reconcile/run'
import { appUrl } from '@/lib/config'

export const runtime = 'nodejs'
export const maxDuration = 120

// GET /api/admin/reconcile/cron — daily, protected by CRON_SECRET (Vercel sends it as a Bearer token)
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const given = (req.headers.get('authorization') ?? '').replace('Bearer ', '') || new URL(req.url).searchParams.get('secret') || ''
  if (!secret || given !== secret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    return NextResponse.json(await runReconciliation(createServiceClient(), 3, appUrl(new URL(req.url).origin)))
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
