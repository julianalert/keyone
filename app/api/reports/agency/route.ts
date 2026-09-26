import { NextRequest, NextResponse } from 'next/server'
import { getSessionContext, unauthorizedResponse } from '@/lib/agency'
import { parseRange, agencyBreakdown } from '@/lib/reports'

// GET /api/reports/agency?range=… → per client (with projects nested)
export async function GET(req: NextRequest) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  const range = parseRange(new URL(req.url).searchParams)

  try {
    const rows = await agencyBreakdown(ctx.supabase, ctx.agencyId, range)
    const clients = new Map<string, {
      client_id: string; client_name: string; rebill_markup_pct: number
      calls: number; blocked: number; price_usd: number; rebill_usd: number
      projects: { project_id: string; project_name: string; calls: number; blocked: number; price_usd: number; rebill_usd: number }[]
    }>()
    for (const r of rows) {
      const m = 1 + r.rebill_markup_pct / 100
      const c = clients.get(r.client_id) ?? {
        client_id: r.client_id, client_name: r.client_name, rebill_markup_pct: r.rebill_markup_pct,
        calls: 0, blocked: 0, price_usd: 0, rebill_usd: 0, projects: [],
      }
      c.calls += r.calls; c.blocked += r.blocked; c.price_usd += r.price_usd
      c.rebill_usd = c.price_usd * m
      c.projects.push({ project_id: r.project_id, project_name: r.project_name, calls: r.calls, blocked: r.blocked, price_usd: r.price_usd, rebill_usd: r.price_usd * m })
      clients.set(r.client_id, c)
    }
    const list = Array.from(clients.values()).sort((a, b) => b.price_usd - a.price_usd)
    for (const c of list) c.projects.sort((a, b) => b.price_usd - a.price_usd)
    const t = list.reduce((s, c) => ({
      calls: s.calls + c.calls, blocked: s.blocked + c.blocked,
      price_usd: s.price_usd + c.price_usd, rebill_usd: s.rebill_usd + c.rebill_usd,
    }), { calls: 0, blocked: 0, price_usd: 0, rebill_usd: 0 })
    return NextResponse.json({ range, totals: t, clients: list })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
