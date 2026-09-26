import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { runController } from '@/lib/controller/run'
import { appUrl } from '@/lib/config'

export const runtime = 'nodejs'
export const maxDuration = 300

// GET /api/controller/cron — run the controller for every enabled agency.
// Protect with CRON_SECRET: send it as Authorization: Bearer <secret>
// (what Vercel Cron does) or ?secret=. Schedule daily in vercel.json.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const given = (req.headers.get('authorization') ?? '').replace('Bearer ', '') || new URL(req.url).searchParams.get('secret') || ''
  if (!secret || given !== secret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const { data: agencies } = await supabase.from('agencies').select('id, name').eq('controller_enabled', true)
  const origin = appUrl(new URL(req.url).origin)

  const results: { agency: string; findings?: number; error?: string }[] = []
  for (const a of agencies ?? []) {
    try {
      const r = await runController(supabase, a.id, 'cron', origin)
      results.push({ agency: a.name, findings: r.findings.length })
    } catch (err) {
      results.push({ agency: a.name, error: err instanceof Error ? err.message : String(err) })
    }
  }
  return NextResponse.json({ ran: results.length, results })
}
