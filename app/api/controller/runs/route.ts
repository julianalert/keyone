import { NextRequest, NextResponse } from 'next/server'
import { getSessionContext, unauthorizedResponse } from '@/lib/agency'

// GET /api/controller/runs?status=proposed — latest runs and findings
export async function GET(req: NextRequest) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  const status = new URL(req.url).searchParams.get('status')

  let fq = ctx.supabase
    .from('controller_findings')
    .select('id, run_id, severity, kind, scope, scope_id, scope_label, title, detail, metrics, action, status, decided_at, decided_by, created_at')
    .eq('agency_id', ctx.agencyId)
    .order('created_at', { ascending: false })
    .limit(100)
  if (status) fq = fq.eq('status', status)

  const [{ data: runs }, { data: findings, error }] = await Promise.all([
    ctx.supabase
      .from('controller_runs')
      .select('id, trigger, status, findings_count, digest, model, llm_cost_usd, error, created_at, completed_at')
      .eq('agency_id', ctx.agencyId)
      .order('created_at', { ascending: false })
      .limit(10),
    fq,
  ])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ latest_run: runs?.[0] ?? null, runs: runs ?? [], findings: findings ?? [] })
}
