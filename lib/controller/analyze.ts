import type { SupabaseClient } from '@supabase/supabase-js'
import { resolveModelPrice, providerCost, userPrice } from '@/lib/billing/pricing'

export type Severity = 'high' | 'medium' | 'low'
export type FindingKind =
  | 'burn_rate' | 'drift' | 'model_efficiency' | 'idle_budget'
  | 'blocked_pattern' | 'waste' | 'pricing_gap' | 'rebill' | 'stale_request'

export interface Action {
  type: 'set_project_budget' | 'set_client_budget' | 'set_max_cost_per_call' | 'set_allowed_models' | 'set_client_markup' | 'approve_request'
  params: Record<string, unknown>
  expected_effect: string
}

export interface Finding {
  severity: Severity
  kind: FindingKind
  scope: 'project' | 'client' | 'key' | 'agency'
  scope_id: string | null
  scope_label: string
  title: string
  detail: string
  metrics: Record<string, unknown>
  action: Action | null
}

interface Fact {
  day: string; client_id: string; project_id: string; project_key_id: string | null; catalog_slug: string; model: string | null
  calls: number; blocked: number; failed: number; input_tokens: number; output_tokens: number
  provider_cost_usd: number; price_usd: number; fallback_priced: number
}

interface Project { id: string; name: string; client_id: string; monthly_budget_usd: number | null; allowed_models: string[] | null; is_active: boolean; created_at: string }
interface Client { id: string; name: string; monthly_budget_usd: number | null; rebill_markup_pct: number; is_active: boolean; created_at: string }

export interface AnalysisContext {
  now: Date
  facts: Fact[]
  projects: Project[]
  clients: Client[]
  pendingRequests: { id: string; project_id: string; requested_budget_usd: number; created_at: string }[]
}

const num = (v: unknown) => Number(v ?? 0)
const money = (v: number) => `$${v.toFixed(v < 0.01 && v > 0 ? 4 : 2)}`

export async function loadContext(supabase: SupabaseClient, agencyId: string, now = new Date()): Promise<AnalysisContext> {
  const from = new Date(now.getTime() - 35 * 86400_000).toISOString()
  const [{ data: facts, error }, { data: projects }, { data: clients }, { data: pending }] = await Promise.all([
    supabase.rpc('controller_facts', { p_agency_id: agencyId, p_from: from }),
    supabase.from('projects').select('id, name, client_id, monthly_budget_usd, allowed_models, is_active, created_at').eq('agency_id', agencyId),
    supabase.from('clients').select('id, name, monthly_budget_usd, rebill_markup_pct, is_active, created_at').eq('agency_id', agencyId),
    supabase.from('budget_requests').select('id, project_id, requested_budget_usd, created_at').eq('agency_id', agencyId).eq('status', 'pending'),
  ])
  if (error) throw new Error(error.message)
  return {
    now,
    facts: (facts ?? []).map((f: Record<string, unknown>) => ({
      day: String(f.day), client_id: String(f.client_id), project_id: String(f.project_id),
      project_key_id: (f.project_key_id as string | null) ?? null, catalog_slug: String(f.catalog_slug), model: (f.model as string | null) ?? null,
      calls: num(f.calls), blocked: num(f.blocked), failed: num(f.failed), input_tokens: num(f.input_tokens), output_tokens: num(f.output_tokens),
      provider_cost_usd: num(f.provider_cost_usd), price_usd: num(f.price_usd), fallback_priced: num(f.fallback_priced),
    })),
    projects: (projects ?? []).map(p => ({ ...p, monthly_budget_usd: p.monthly_budget_usd === null ? null : Number(p.monthly_budget_usd) })),
    clients: (clients ?? []).map(c => ({ ...c, monthly_budget_usd: c.monthly_budget_usd === null ? null : Number(c.monthly_budget_usd), rebill_markup_pct: Number(c.rebill_markup_pct ?? 0) })),
    pendingRequests: (pending ?? []).map(r => ({ ...r, requested_budget_usd: Number(r.requested_budget_usd) })),
  }
}

// Cheapest model per provider we'd suggest for short outputs
const CHEAP_ALTERNATIVE: Record<string, string> = { anthropic: 'claude-haiku-4-5', openai: 'gpt-5-mini' }
const EXPENSIVE_INPUT_THRESHOLD = 4 // $/1M input: above this a model counts as premium

export async function analyze(ctx: AnalysisContext): Promise<Finding[]> {
  const { now, facts, projects, clients } = ctx
  const findings: Finding[] = []
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const daysInMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate()
  const dayOfMonth = now.getUTCDate()
  const daysAgo = (d: string) => Math.floor((now.getTime() - new Date(d + 'T00:00:00Z').getTime()) / 86400_000)
  const projectById = new Map(projects.map(p => [p.id, p]))
  const clientById = new Map(clients.map(c => [c.id, c]))
  const label = (p: Project) => `${clientById.get(p.client_id)?.name ?? '?'} / ${p.name}`

  const mtd = facts.filter(f => f.day >= monthStart.toISOString().slice(0, 10))
  const sum = (rows: Fact[], k: keyof Fact) => rows.reduce((s, r) => s + Number(r[k]), 0)

  // 1. Burn rate vs budget (projects and clients)
  for (const p of projects.filter(p => p.is_active && p.monthly_budget_usd)) {
    const spent = sum(mtd.filter(f => f.project_id === p.id), 'price_usd')
    if (spent <= 0 || dayOfMonth < 2) continue
    const projected = (spent / dayOfMonth) * daysInMonth
    const budget = p.monthly_budget_usd!
    if (projected > budget * 1.05) {
      const dayHit = Math.ceil(budget / (spent / dayOfMonth))
      const suggested = Math.ceil(projected * 1.15 * 100) / 100
      findings.push({
        severity: projected > budget * 1.5 ? 'high' : 'medium', kind: 'burn_rate', scope: 'project', scope_id: p.id, scope_label: label(p),
        title: `${label(p)} is on track to spend ${money(projected)} of its ${money(budget)} budget`,
        detail: `Spent ${money(spent)} in ${dayOfMonth} days. At this rate the budget runs out around day ${Math.min(dayHit, daysInMonth)} and calls get blocked for the rest of the month.`,
        metrics: { spent_usd: spent, projected_usd: projected, budget_usd: budget, day_budget_hit: dayHit },
        action: { type: 'set_project_budget', params: { project_id: p.id, monthly_budget_usd: suggested }, expected_effect: `No blocks this month; budget ${money(budget)} → ${money(suggested)}.` },
      })
    }
  }
  for (const c of clients.filter(c => c.is_active && c.monthly_budget_usd)) {
    const spent = sum(mtd.filter(f => f.client_id === c.id), 'price_usd')
    if (spent <= 0 || dayOfMonth < 2) continue
    const projected = (spent / dayOfMonth) * daysInMonth
    const budget = c.monthly_budget_usd!
    if (projected > budget * 1.05) {
      const suggested = Math.ceil(projected * 1.15 * 100) / 100
      findings.push({
        severity: projected > budget * 1.5 ? 'high' : 'medium', kind: 'burn_rate', scope: 'client', scope_id: c.id, scope_label: c.name,
        title: `Client ${c.name} is on track to spend ${money(projected)} of its ${money(budget)} budget`,
        detail: `Spent ${money(spent)} in ${dayOfMonth} days across all its projects.`,
        metrics: { spent_usd: spent, projected_usd: projected, budget_usd: budget },
        action: { type: 'set_client_budget', params: { client_id: c.id, monthly_budget_usd: suggested }, expected_effect: `Budget ${money(budget)} → ${money(suggested)}.` },
      })
    }
  }

  // 2. Drift: this week vs the average of the prior three weeks
  for (const p of projects.filter(p => p.is_active)) {
    const rows = facts.filter(f => f.project_id === p.id)
    const thisWeek = sum(rows.filter(f => daysAgo(f.day) < 7), 'price_usd')
    const prior = sum(rows.filter(f => daysAgo(f.day) >= 7 && daysAgo(f.day) < 28), 'price_usd') / 3
    if (prior > 0.01 && thisWeek > prior * 2.5) {
      findings.push({
        severity: thisWeek > prior * 5 ? 'high' : 'medium', kind: 'drift', scope: 'project', scope_id: p.id, scope_label: label(p),
        title: `${label(p)} spent ${(thisWeek / prior).toFixed(1)}× its usual weekly amount`,
        detail: `${money(thisWeek)} this week against a ${money(prior)} weekly average over the previous three weeks. Worth checking whether a workflow changed or a loop is running.`,
        metrics: { this_week_usd: thisWeek, prior_weekly_avg_usd: prior },
        action: null,
      })
    }
  }

  // 3. Model efficiency: premium model, short outputs
  for (const p of projects.filter(p => p.is_active)) {
    const byModel = new Map<string, Fact[]>()
    for (const f of facts.filter(f => f.project_id === p.id && f.model && daysAgo(f.day) < 30)) {
      byModel.set(f.model!, [...(byModel.get(f.model!) ?? []), f])
    }
    for (const [model, rows] of Array.from(byModel.entries())) {
      const calls = sum(rows, 'calls'); if (calls < 5) continue
      const outTok = sum(rows, 'output_tokens'), inTok = sum(rows, 'input_tokens')
      const provider = rows[0].catalog_slug
      const price = await resolveModelPrice(provider, model)
      if (!price || price.status === 'fallback' || price.input_per_million < EXPENSIVE_INPUT_THRESHOLD) continue
      const avgOut = outTok / calls
      if (avgOut > 150) continue
      const alt = CHEAP_ALTERNATIVE[provider]; if (!alt || alt === model) continue
      const altPrice = await resolveModelPrice(provider, alt); if (!altPrice) continue
      const spent = sum(rows, 'price_usd')
      const altCost = userPrice(providerCost(altPrice, { input_tokens: inTok, output_tokens: outTok }))
      if (spent - altCost < 0.005) continue
      findings.push({
        severity: spent - altCost > 5 ? 'high' : 'medium', kind: 'model_efficiency', scope: 'project', scope_id: p.id, scope_label: label(p),
        title: `${label(p)} used ${model} for ${calls} short calls (avg ${Math.round(avgOut)} tokens out)`,
        detail: `Those calls cost ${money(spent)}. The same tokens on ${alt} would have cost about ${money(altCost)}. Short answers rarely need a premium model.`,
        metrics: { model, alternative: alt, calls, avg_output_tokens: avgOut, spent_usd: spent, alternative_cost_usd: altCost, saving_usd: spent - altCost },
        action: { type: 'set_allowed_models', params: { project_id: p.id, allowed_models: [alt] }, expected_effect: `Project restricted to ${alt}; other models get BLOCKED with a clear reason.` },
      })
    }
  }

  // 4. Idle budget: budget set, almost no spend in 30 days. Only once the
  //    project or client has existed for the whole window: a budget set last
  //    week has had no month to be used yet.
  const IDLE_MIN_AGE_DAYS = 30
  const ageDays = (createdAt: string) => (now.getTime() - new Date(createdAt).getTime()) / 86400_000
  for (const p of projects.filter(p => p.is_active && p.monthly_budget_usd && p.monthly_budget_usd >= 20 && ageDays(p.created_at) >= IDLE_MIN_AGE_DAYS)) {
    const spent30 = sum(facts.filter(f => f.project_id === p.id && daysAgo(f.day) < 30), 'price_usd')
    if (spent30 < p.monthly_budget_usd! * 0.02) {
      const suggested = Math.max(5, Math.ceil(spent30 * 5))
      findings.push({
        severity: 'low', kind: 'idle_budget', scope: 'project', scope_id: p.id, scope_label: label(p),
        title: `${label(p)} has a ${money(p.monthly_budget_usd!)} budget but spent ${money(spent30)} in 30 days`,
        detail: `Unused budget is unmanaged exposure: a leaked key could spend all of it. Lower it to what the project actually uses, or free it for another client.`,
        metrics: { budget_usd: p.monthly_budget_usd, spent_30d_usd: spent30 },
        action: { type: 'set_project_budget', params: { project_id: p.id, monthly_budget_usd: suggested }, expected_effect: `Budget ${money(p.monthly_budget_usd!)} → ${money(suggested)}.` },
      })
    }
  }
  for (const c of clients.filter(c => c.is_active && c.monthly_budget_usd && c.monthly_budget_usd >= 20 && ageDays(c.created_at) >= IDLE_MIN_AGE_DAYS)) {
    const spent30 = sum(facts.filter(f => f.client_id === c.id && daysAgo(f.day) < 30), 'price_usd')
    if (spent30 < c.monthly_budget_usd! * 0.02) {
      const suggested = Math.max(5, Math.ceil(spent30 * 5))
      findings.push({
        severity: 'low', kind: 'idle_budget', scope: 'client', scope_id: c.id, scope_label: c.name,
        title: `Client ${c.name} has a ${money(c.monthly_budget_usd!)} budget but spent ${money(spent30)} in 30 days`,
        detail: `Lower it to match real usage, or leave it if a campaign is about to start.`,
        metrics: { budget_usd: c.monthly_budget_usd, spent_30d_usd: spent30 },
        action: { type: 'set_client_budget', params: { client_id: c.id, monthly_budget_usd: suggested }, expected_effect: `Budget ${money(c.monthly_budget_usd!)} → ${money(suggested)}.` },
      })
    }
  }

  // 5. Blocked patterns (last 7 days)
  for (const p of projects.filter(p => p.is_active)) {
    const rows = facts.filter(f => f.project_id === p.id && daysAgo(f.day) < 7)
    const blocked = sum(rows, 'blocked'), calls = sum(rows, 'calls')
    if (blocked >= 5 && blocked >= calls * 0.2) {
      findings.push({
        severity: blocked >= calls ? 'high' : 'medium', kind: 'blocked_pattern', scope: 'project', scope_id: p.id, scope_label: label(p),
        title: `${label(p)} had ${blocked} blocked calls this week against ${calls} completed`,
        detail: `Repeated blocks usually mean the budget or allowed-tools list doesn't match what the project is supposed to do, not that an agent went rogue. Check the reasons on the project page.`,
        metrics: { blocked, completed: calls },
        action: null,
      })
    }
  }

  // 6. Waste: failure rate (last 7 days)
  for (const p of projects.filter(p => p.is_active)) {
    const rows = facts.filter(f => f.project_id === p.id && daysAgo(f.day) < 7)
    const failed = sum(rows, 'failed'), calls = sum(rows, 'calls')
    if (failed >= 5 && failed >= (calls + failed) * 0.25) {
      findings.push({
        severity: 'medium', kind: 'waste', scope: 'project', scope_id: p.id, scope_label: label(p),
        title: `${label(p)} had ${failed} failed provider calls this week (${Math.round((failed / (calls + failed)) * 100)}%)`,
        detail: `Failures aren't charged, but the retries around them are. Check the error responses in the call log.`,
        metrics: { failed, completed: calls },
        action: null,
      })
    }
  }

  // 7. Pricing gaps
  const fallback = facts.filter(f => f.fallback_priced > 0 && daysAgo(f.day) < 30)
  if (fallback.length) {
    const models = Array.from(new Set(fallback.map(f => `${f.catalog_slug}:${f.model}`)))
    findings.push({
      severity: 'low', kind: 'pricing_gap', scope: 'agency', scope_id: null, scope_label: 'Pricing',
      title: `${sum(fallback, 'fallback_priced')} calls were priced at the provider fallback rate`,
      detail: `Models without a price row are charged at the provider's top tier so nothing is free by accident, but projects are probably overpaying. Add rows in model_prices for: ${models.join(', ')}.`,
      metrics: { models },
      action: null,
    })
  }

  // 8. Rebill hygiene
  for (const c of clients.filter(c => c.is_active && c.rebill_markup_pct === 0)) {
    const spent30 = sum(facts.filter(f => f.client_id === c.id && daysAgo(f.day) < 30), 'price_usd')
    if (spent30 > 1) {
      findings.push({
        severity: 'low', kind: 'rebill', scope: 'client', scope_id: c.id, scope_label: c.name,
        title: `Client ${c.name} spent ${money(spent30)} in 30 days with no rebill markup`,
        detail: `You're passing AI costs through at cost. Even a modest markup covers the management you do around it.`,
        metrics: { spent_30d_usd: spent30 },
        action: { type: 'set_client_markup', params: { client_id: c.id, rebill_markup_pct: 20 }, expected_effect: `Rebill amounts for ${c.name} become cost + 20%.` },
      })
    }
  }

  // 9. Stale requests
  for (const r of ctx.pendingRequests) {
    const ageDays = (now.getTime() - new Date(r.created_at).getTime()) / 86400_000
    if (ageDays >= 1) {
      const p = projectById.get(r.project_id)
      findings.push({
        severity: ageDays >= 3 ? 'medium' : 'low', kind: 'stale_request', scope: 'project', scope_id: r.project_id, scope_label: p ? label(p) : 'Project',
        title: `A budget request for ${p ? label(p) : 'a project'} has waited ${Math.floor(ageDays)} day${Math.floor(ageDays) === 1 ? '' : 's'}`,
        detail: `${money(r.requested_budget_usd)}/month requested. Until it's decided the project may be blocked.`,
        metrics: { request_id: r.id, requested_budget_usd: r.requested_budget_usd, age_days: ageDays },
        action: { type: 'approve_request', params: { request_id: r.id }, expected_effect: `Budget becomes ${money(r.requested_budget_usd)}/month.` },
      })
    }
  }

  const rank: Record<Severity, number> = { high: 0, medium: 1, low: 2 }
  return findings.sort((a, b) => rank[a.severity] - rank[b.severity])
}

