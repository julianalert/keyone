// Pull actual billed cost and token counts from the providers' admin APIs.
// Both return per-day, per-model rows in USD. Shapes are tolerant: fields
// that are missing simply count as zero.

export interface ActualRow { provider: 'openai' | 'anthropic'; day: string; model: string; cost_usd: number; input_tokens: number; output_tokens: number }

export function normalizeModel(id: string | null | undefined): string {
  if (!id) return '(none)'
  return id.replace(/-\d{8}$/, '').replace(/-\d{4}-\d{2}-\d{2}$/, '')
}

export function openaiAdminConfigured() { return (process.env.OPENAI_ADMIN_KEY ?? '').startsWith('sk-') }
export function anthropicAdminConfigured() { return (process.env.ANTHROPIC_ADMIN_KEY ?? '').startsWith('sk-ant-') }

const dayOf = (unixOrIso: number | string) => new Date(typeof unixOrIso === 'number' ? unixOrIso * 1000 : unixOrIso).toISOString().slice(0, 10)

// ------------------------------------------------------------
// OpenAI: GET /v1/organization/costs (money, by line item) and
//         GET /v1/organization/usage/completions (tokens, by model)
// Requires an Admin API key. OPENAI_PROJECT_ID narrows to one project.
// ------------------------------------------------------------
export async function fetchOpenAIActuals(from: Date, to: Date): Promise<ActualRow[]> {
  const key = process.env.OPENAI_ADMIN_KEY!
  const project = process.env.OPENAI_PROJECT_ID
  const headers = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }
  const start = Math.floor(from.getTime() / 1000), end = Math.floor(to.getTime() / 1000)

  async function paged(path: string, params: Record<string, string | string[]>) {
    const out: Record<string, unknown>[] = []
    let page: string | null = null
    for (let i = 0; i < 20; i++) {
      const qs = new URLSearchParams()
      for (const [k, v] of Object.entries(params)) (Array.isArray(v) ? v : [v]).forEach(x => qs.append(k, x))
      if (page) qs.set('page', page)
      const res = await fetch(`https://api.openai.com${path}?${qs}`, { headers })
      if (!res.ok) throw new Error(`OpenAI ${path} ${res.status}: ${(await res.text()).slice(0, 200)}`)
      const json = await res.json() as { data?: Record<string, unknown>[]; has_more?: boolean; next_page?: string | null }
      out.push(...(json.data ?? []))
      if (!json.has_more || !json.next_page) break
      page = json.next_page
    }
    return out
  }

  const common: Record<string, string | string[]> = { start_time: String(start), end_time: String(end), bucket_width: '1d', limit: '31' }
  if (project) common.project_ids = [project]

  const [costBuckets, usageBuckets] = await Promise.all([
    paged('/v1/organization/costs', { ...common, group_by: ['line_item', 'project_id'] }),
    paged('/v1/organization/usage/completions', { ...common, group_by: ['model', 'project_id'] }),
  ])

  const rows = new Map<string, ActualRow>()
  const get = (day: string, model: string) => rows.get(`${day}|${model}`) ?? rows.set(`${day}|${model}`, { provider: 'openai', day, model, cost_usd: 0, input_tokens: 0, output_tokens: 0 }).get(`${day}|${model}`)!

  for (const b of costBuckets) {
    const day = dayOf(Number(b.start_time))
    for (const r of (b.results as Record<string, unknown>[] | undefined) ?? []) {
      const amount = (r.amount as { value?: number } | undefined)?.value ?? 0
      // line_item looks like "gpt-4o-mini, input" / "gpt-4o-mini, output" / "gpt-4o-mini, cached input"
      const li = String(r.line_item ?? '')
      const model = normalizeModel(li.split(',')[0].trim() || 'other')
      get(day, model).cost_usd += Number(amount)
    }
  }
  for (const b of usageBuckets) {
    const day = dayOf(Number(b.start_time))
    for (const r of (b.results as Record<string, unknown>[] | undefined) ?? []) {
      const model = normalizeModel(String(r.model ?? 'other'))
      const row = get(day, model)
      row.input_tokens += Number(r.input_tokens ?? 0)
      row.output_tokens += Number(r.output_tokens ?? 0)
    }
  }
  return Array.from(rows.values())
}

// ------------------------------------------------------------
// Anthropic: GET /v1/organizations/cost_report (amount in cents, by description)
//            GET /v1/organizations/usage_report/messages (tokens, by model)
// Requires an Admin API key. ANTHROPIC_WORKSPACE_ID narrows to one workspace.
// ------------------------------------------------------------
export async function fetchAnthropicActuals(from: Date, to: Date): Promise<ActualRow[]> {
  const key = process.env.ANTHROPIC_ADMIN_KEY!
  const workspace = process.env.ANTHROPIC_WORKSPACE_ID
  const headers = { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'User-Agent': 'keyone/1.0 (https://getkeyone.com)' }

  async function paged(path: string, params: Record<string, string | string[]>) {
    const out: Record<string, unknown>[] = []
    let page: string | null = null
    for (let i = 0; i < 20; i++) {
      const qs = new URLSearchParams()
      for (const [k, v] of Object.entries(params)) (Array.isArray(v) ? v : [v]).forEach(x => qs.append(k, x))
      if (page) qs.set('page', page)
      const res = await fetch(`https://api.anthropic.com${path}?${qs}`, { headers })
      if (!res.ok) throw new Error(`Anthropic ${path} ${res.status}: ${(await res.text()).slice(0, 200)}`)
      const json = await res.json() as { data?: Record<string, unknown>[]; has_more?: boolean; next_page?: string | null }
      out.push(...(json.data ?? []))
      if (!json.has_more || !json.next_page) break
      page = json.next_page
    }
    return out
  }

  const common: Record<string, string | string[]> = { starting_at: from.toISOString(), ending_at: to.toISOString(), bucket_width: '1d', limit: '31' }
  const costParams: Record<string, string | string[]> = { ...common, 'group_by[]': ['description', 'workspace_id'] }
  const usageParams: Record<string, string | string[]> = { ...common, 'group_by[]': ['model', 'workspace_id'] }
  if (workspace) { costParams['workspace_ids[]'] = [workspace]; usageParams['workspace_ids[]'] = [workspace] }

  const [costBuckets, usageBuckets] = await Promise.all([
    paged('/v1/organizations/cost_report', costParams),
    paged('/v1/organizations/usage_report/messages', usageParams),
  ])

  const rows = new Map<string, ActualRow>()
  const get = (day: string, model: string) => rows.get(`${day}|${model}`) ?? rows.set(`${day}|${model}`, { provider: 'anthropic', day, model, cost_usd: 0, input_tokens: 0, output_tokens: 0 }).get(`${day}|${model}`)!

  for (const b of costBuckets) {
    const day = dayOf(String(b.starting_at))
    for (const r of (b.results as Record<string, unknown>[] | undefined) ?? []) {
      if (workspace && r.workspace_id && r.workspace_id !== workspace) continue
      const model = normalizeModel((r.model as string | null) ?? (r.cost_type === 'tokens' ? 'other' : String(r.cost_type ?? 'other')))
      get(day, model).cost_usd += Number(r.amount ?? 0) / 100   // amount is in cents
    }
  }
  for (const b of usageBuckets) {
    const day = dayOf(String(b.starting_at))
    for (const r of (b.results as Record<string, unknown>[] | undefined) ?? []) {
      if (workspace && r.workspace_id && r.workspace_id !== workspace) continue
      const model = normalizeModel(String(r.model ?? 'other'))
      const row = get(day, model)
      const cc = (r.cache_creation as Record<string, number> | undefined) ?? {}
      row.input_tokens += Number(r.uncached_input_tokens ?? 0) + Number(r.cache_read_input_tokens ?? 0) + Object.values(cc).reduce((s, v) => s + Number(v ?? 0), 0)
      row.output_tokens += Number(r.output_tokens ?? 0)
    }
  }
  return Array.from(rows.values())
}
