import { NextRequest, NextResponse } from 'next/server'
import { getSessionContext, unauthorizedResponse } from '@/lib/agency'
import { parseRange, clientLineItems, csv } from '@/lib/reports'

// GET /api/reports/clients/:id/export?range=…  → CSV of line items + totals
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getSessionContext(req)
  if (!ctx) return unauthorizedResponse()
  const range = parseRange(new URL(req.url).searchParams)

  const { data: client } = await ctx.supabase
    .from('clients')
    .select('id, name, rebill_markup_pct')
    .eq('id', params.id)
    .eq('agency_id', ctx.agencyId)
    .single()
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const m = 1 + Number(client.rebill_markup_pct ?? 0) / 100
  const items = await clientLineItems(ctx.supabase, params.id, range)

  const rows: (string | number | null)[][] = [[
    'date', 'project', 'tool', 'model', 'status', 'stream', 'input_tokens', 'cached_input_tokens', 'output_tokens',
    'provider_cost_usd', 'price_usd', 'rebill_usd', 'pricing_status', 'blocked_reason',
  ]]
  let price = 0, cost = 0
  for (const it of items) {
    const p = it.projects as { name: string } | null
    const a = it.catalog_apis as { slug: string; name: string } | null
    const priceUsd = Number(it.cost_usd ?? 0), costUsd = Number(it.provider_cost_usd ?? 0)
    price += priceUsd; cost += costUsd
    rows.push([
      String(it.created_at), p?.name ?? '', a?.slug ?? '', (it.model as string) ?? '', String(it.status), it.is_stream ? 'yes' : 'no',
      (it.input_tokens as number) ?? '', (it.cached_input_tokens as number) ?? '', (it.output_tokens as number) ?? '',
      costUsd.toFixed(6), priceUsd.toFixed(6), (priceUsd * m).toFixed(6), (it.pricing_status as string) ?? '', (it.blocked_reason as string) ?? '',
    ])
  }
  rows.push([])
  rows.push(['TOTAL', client.name, range.label, '', `${items.length} rows`, '', '', '', '', cost.toFixed(6), price.toFixed(6), (price * m).toFixed(6), `markup ${client.rebill_markup_pct ?? 0}%`, ''])

  const filename = `keyone-${client.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${range.label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.csv`
  return new Response(csv(rows), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${filename}"` },
  })
}
