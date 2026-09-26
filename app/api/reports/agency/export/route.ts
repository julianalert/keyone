import { NextRequest, NextResponse } from 'next/server'
import { getSessionContext, unauthorizedResponse } from '@/lib/agency'
import { parseRange, agencyBreakdown, csv } from '@/lib/reports'

// GET /api/reports/agency/export?range=… → CSV, one row per client × project
export async function GET(req: NextRequest) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  const range = parseRange(new URL(req.url).searchParams)
  const rows = await agencyBreakdown(ctx.supabase, ctx.agencyId, range).catch(() => null)
  if (!rows) return NextResponse.json({ error: 'Report failed' }, { status: 500 })

  const out: (string | number)[][] = [['client', 'project', 'calls', 'blocked', 'price_usd', 'markup_pct', 'rebill_usd']]
  let price = 0, rebill = 0
  for (const r of rows.sort((a, b) => a.client_name.localeCompare(b.client_name) || b.price_usd - a.price_usd)) {
    const rb = r.price_usd * (1 + r.rebill_markup_pct / 100)
    price += r.price_usd; rebill += rb
    out.push([r.client_name, r.project_name, r.calls, r.blocked, r.price_usd.toFixed(6), r.rebill_markup_pct, rb.toFixed(6)])
  }
  out.push([])
  out.push(['TOTAL', range.label, '', '', price.toFixed(6), '', rebill.toFixed(6)])

  return new Response(csv(out), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="keyone-agency-${range.label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.csv"` },
  })
}
