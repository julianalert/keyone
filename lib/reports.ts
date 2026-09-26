import type { SupabaseClient } from '@supabase/supabase-js'

export interface Range { from: string; to: string; label: string }

// ?range=this_month|last_month  or ?from=YYYY-MM-DD&to=YYYY-MM-DD (to is exclusive of the next day)
export function parseRange(sp: URLSearchParams, now = new Date()): Range {
  const preset = sp.get('range') ?? 'this_month'
  const y = now.getUTCFullYear(), m = now.getUTCMonth()
  if (sp.get('from')) {
    const from = new Date(sp.get('from')!)
    const toDay = sp.get('to') ? new Date(sp.get('to')!) : now
    const to = new Date(Date.UTC(toDay.getUTCFullYear(), toDay.getUTCMonth(), toDay.getUTCDate() + 1))
    return { from: from.toISOString(), to: to.toISOString(), label: `${sp.get('from')} to ${sp.get('to') ?? 'today'}` }
  }
  if (preset === 'last_month') {
    return {
      from: new Date(Date.UTC(y, m - 1, 1)).toISOString(),
      to: new Date(Date.UTC(y, m, 1)).toISOString(),
      label: new Date(Date.UTC(y, m - 1, 1)).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
    }
  }
  return {
    from: new Date(Date.UTC(y, m, 1)).toISOString(),
    to: new Date(Date.UTC(y, m + 1, 1)).toISOString(),
    label: new Date(Date.UTC(y, m, 1)).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
  }
}

export interface ClientBreakdownRow {
  project_id: string; project_name: string
  catalog_slug: string; catalog_name: string
  model: string | null
  calls: number; blocked: number; failed: number
  input_tokens: number; output_tokens: number
  provider_cost_usd: number; price_usd: number
}

const num = (v: unknown) => Number(v ?? 0)

export async function clientBreakdown(supabase: SupabaseClient, clientId: string, r: Range): Promise<ClientBreakdownRow[]> {
  const { data, error } = await supabase.rpc('report_client_breakdown', { p_client_id: clientId, p_from: r.from, p_to: r.to })
  if (error) throw new Error(error.message)
  return (data ?? []).map((x: Record<string, unknown>) => ({
    project_id: String(x.project_id), project_name: String(x.project_name),
    catalog_slug: String(x.catalog_slug), catalog_name: String(x.catalog_name),
    model: (x.model as string | null) ?? null,
    calls: num(x.calls), blocked: num(x.blocked), failed: num(x.failed),
    input_tokens: num(x.input_tokens), output_tokens: num(x.output_tokens),
    provider_cost_usd: num(x.provider_cost_usd), price_usd: num(x.price_usd),
  }))
}

export interface Bucket { key: string; name: string; calls: number; blocked: number; provider_cost_usd: number; price_usd: number; rebill_usd: number }

export function pivot(rows: ClientBreakdownRow[], by: 'project' | 'tool' | 'model', markupPct: number): Bucket[] {
  const m = 1 + markupPct / 100
  const acc = new Map<string, Bucket>()
  for (const r of rows) {
    const [key, name] =
      by === 'project' ? [r.project_id, r.project_name]
      : by === 'tool' ? [r.catalog_slug, r.catalog_name]
      : [r.model ?? '—', r.model ?? '(no model)']
    const b = acc.get(key) ?? { key, name, calls: 0, blocked: 0, provider_cost_usd: 0, price_usd: 0, rebill_usd: 0 }
    b.calls += r.calls; b.blocked += r.blocked
    b.provider_cost_usd += r.provider_cost_usd; b.price_usd += r.price_usd
    b.rebill_usd = b.price_usd * m
    acc.set(key, b)
  }
  return Array.from(acc.values()).sort((a, b) => b.price_usd - a.price_usd)
}

export function totals(rows: ClientBreakdownRow[], markupPct: number) {
  const t = rows.reduce(
    (s, r) => ({
      calls: s.calls + r.calls, blocked: s.blocked + r.blocked, failed: s.failed + r.failed,
      input_tokens: s.input_tokens + r.input_tokens, output_tokens: s.output_tokens + r.output_tokens,
      provider_cost_usd: s.provider_cost_usd + r.provider_cost_usd, price_usd: s.price_usd + r.price_usd,
    }),
    { calls: 0, blocked: 0, failed: 0, input_tokens: 0, output_tokens: 0, provider_cost_usd: 0, price_usd: 0 }
  )
  return { ...t, rebill_usd: t.price_usd * (1 + markupPct / 100), margin_usd: t.price_usd - t.provider_cost_usd }
}

export interface AgencyBreakdownRow {
  client_id: string; client_name: string; rebill_markup_pct: number
  project_id: string; project_name: string
  calls: number; blocked: number; provider_cost_usd: number; price_usd: number
}

export async function agencyBreakdown(supabase: SupabaseClient, agencyId: string, r: Range): Promise<AgencyBreakdownRow[]> {
  const { data, error } = await supabase.rpc('report_agency_breakdown', { p_agency_id: agencyId, p_from: r.from, p_to: r.to })
  if (error) throw new Error(error.message)
  return (data ?? []).map((x: Record<string, unknown>) => ({
    client_id: String(x.client_id), client_name: String(x.client_name), rebill_markup_pct: num(x.rebill_markup_pct),
    project_id: String(x.project_id), project_name: String(x.project_name),
    calls: num(x.calls), blocked: num(x.blocked), provider_cost_usd: num(x.provider_cost_usd), price_usd: num(x.price_usd),
  }))
}

export async function dailySeries(supabase: SupabaseClient, scope: 'client' | 'project', id: string, r: Range) {
  const { data } = await supabase.rpc('report_daily', { p_scope: scope, p_id: id, p_from: r.from, p_to: r.to })
  return (data ?? []).map((x: Record<string, unknown>) => ({ day: String(x.day), calls: num(x.calls), price_usd: num(x.price_usd) }))
}

// Line items for an invoice-grade export. Pages through the log in 1000s.
export async function clientLineItems(supabase: SupabaseClient, clientId: string, r: Range, max = 50_000) {
  const out: Record<string, unknown>[] = []
  let from = 0
  while (out.length < max) {
    const { data, error } = await supabase
      .from('api_calls')
      .select('created_at, project_id, model, status, input_tokens, output_tokens, cached_input_tokens, provider_cost_usd, cost_usd, pricing_status, is_stream, blocked_reason, projects(name), catalog_apis(slug, name)')
      .eq('client_id', clientId)
      .gte('created_at', r.from)
      .lt('created_at', r.to)
      .order('created_at', { ascending: true })
      .range(from, from + 999)
    if (error) throw new Error(error.message)
    if (!data || data.length === 0) break
    out.push(...(data as Record<string, unknown>[]))
    if (data.length < 1000) break
    from += 1000
  }
  return out
}

export function csv(rows: (string | number | null | undefined)[][]): string {
  const esc = (v: string | number | null | undefined) => {
    const s = v === null || v === undefined ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return rows.map(r => r.map(esc).join(',')).join('\n') + '\n'
}
