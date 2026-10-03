import type { SupabaseClient } from '@supabase/supabase-js'
import { loadContext, analyze, type Finding, type Action } from './analyze'
import { writeDigest } from './digest'
import { raiseAlert } from '@/lib/notify'
import { decideBudgetRequest } from '@/lib/requests'

export interface RunResult { run_id: string; findings: (Finding & { id: string; status: string })[]; digest: string; model: string | null; llm_cost_usd: number }

export async function runController(
  supabase: SupabaseClient,
  agencyId: string,
  trigger: 'manual' | 'mcp' | 'cron',
  origin: string
): Promise<RunResult> {
  const now = new Date()
  const { data: agency } = await supabase.from('agencies').select('name, controller_enabled').eq('id', agencyId).single()
  if (!agency) throw new Error('Agency not found')

  const { data: run, error } = await supabase
    .from('controller_runs')
    .insert({ agency_id: agencyId, trigger, window_from: new Date(now.getTime() - 35 * 86400_000).toISOString(), window_to: now.toISOString() })
    .select('id')
    .single()
  if (error || !run) throw new Error(error?.message ?? 'Failed to start run')

  try {
    const ctx = await loadContext(supabase, agencyId, now)
    const findings = await analyze(ctx)

    // Don't re-propose what's already open, nor what was decided in the
    // last 7 days: a dismissed finding shouldn't nag, an applied one needs
    // time to take effect before it can legitimately come back. Identity is
    // the kind and the thing it's about, never the wording: a title that
    // carries today's spend would otherwise count as new every time a cent moves.
    const cooldown = new Date(now.getTime() - 7 * 86400_000).toISOString()
    const { data: recent } = await supabase
      .from('controller_findings')
      .select('kind, scope_id, status, decided_at')
      .eq('agency_id', agencyId)
      .or(`status.eq.proposed,decided_at.gte.${cooldown}`)
    const seen = new Set((recent ?? []).map(o => `${o.kind}:${o.scope_id}`))
    const fresh = findings.filter(f => !seen.has(`${f.kind}:${f.scope_id}`))
    const openCount = (recent ?? []).filter(o => o.status === 'proposed').length

    // Only pay for a written digest when there is something new to say
    const digest = fresh.length
      ? await writeDigest(agency.name, findings)
      : {
          text: openCount
            ? `Nothing new at ${agency.name}. ${openCount} proposal${openCount === 1 ? ' is' : 's are'} still waiting for a decision in the dashboard.`
            : `Nothing needs attention at ${agency.name}. Spend is within budgets and no anomalies were found.`,
          model: null,
          cost_usd: 0,
        }

    let stored: (Finding & { id: string; status: string })[] = []
    if (fresh.length) {
      const { data: rows } = await supabase
        .from('controller_findings')
        .insert(fresh.map(f => ({ run_id: run.id, agency_id: agencyId, ...f })))
        .select('id, status, severity, kind, scope, scope_id, scope_label, title, detail, metrics, action')
      stored = (rows ?? []) as (Finding & { id: string; status: string })[]
    }

    await supabase
      .from('controller_runs')
      .update({ status: 'completed', findings_count: findings.length, digest: digest.text, model: digest.model, llm_cost_usd: digest.cost_usd, completed_at: new Date().toISOString() })
      .eq('id', run.id)

    if (fresh.length && agency.controller_enabled) {
      await raiseAlert(supabase, {
        agency_id: agencyId,
        kind: 'controller_digest',
        scope: 'agency',
        scope_id: agencyId,
        dedupe_key: `controller:${run.id}`,
        title: `Controller: ${fresh.length} new finding${fresh.length === 1 ? '' : 's'} at ${agency.name}`,
        body: digest.text,
        data: { run_id: run.id, links: { 'Review proposals': `${origin}/dashboard/controller` } },
      })
    }

    return { run_id: run.id, findings: stored, digest: digest.text, model: digest.model, llm_cost_usd: digest.cost_usd }
  } catch (err) {
    await supabase.from('controller_runs').update({ status: 'failed', error: String(err), completed_at: new Date().toISOString() }).eq('id', run.id)
    throw err
  }
}

// Apply a proposal using the same writes the dashboard does. Scoped by agency.
export async function applyAction(supabase: SupabaseClient, agencyId: string, action: Action, origin: string): Promise<string> {
  const p = action.params
  switch (action.type) {
    case 'set_project_budget': {
      const { error } = await supabase.from('projects').update({ monthly_budget_usd: Number(p.monthly_budget_usd) }).eq('id', String(p.project_id)).eq('agency_id', agencyId)
      if (error) throw new Error(error.message)
      return `Project budget set to $${Number(p.monthly_budget_usd).toFixed(2)}`
    }
    case 'set_client_budget': {
      const { error } = await supabase.from('clients').update({ monthly_budget_usd: Number(p.monthly_budget_usd) }).eq('id', String(p.client_id)).eq('agency_id', agencyId)
      if (error) throw new Error(error.message)
      return `Client budget set to $${Number(p.monthly_budget_usd).toFixed(2)}`
    }
    case 'set_max_cost_per_call': {
      const { error } = await supabase.from('projects').update({ max_cost_per_call_usd: Number(p.max_cost_per_call_usd) }).eq('id', String(p.project_id)).eq('agency_id', agencyId)
      if (error) throw new Error(error.message)
      return `Per-call cap set to $${Number(p.max_cost_per_call_usd).toFixed(4)}`
    }
    case 'set_allowed_models': {
      const models = Array.isArray(p.allowed_models) ? (p.allowed_models as unknown[]).map(String) : null
      const { error } = await supabase.from('projects').update({ allowed_models: models && models.length ? models : null }).eq('id', String(p.project_id)).eq('agency_id', agencyId)
      if (error) throw new Error(error.message)
      return `Allowed models set to ${models?.join(', ') ?? 'any'}`
    }
    case 'set_client_markup': {
      const { error } = await supabase.from('clients').update({ rebill_markup_pct: Number(p.rebill_markup_pct) }).eq('id', String(p.client_id)).eq('agency_id', agencyId)
      if (error) throw new Error(error.message)
      return `Rebill markup set to ${Number(p.rebill_markup_pct)}%`
    }
    case 'approve_request': {
      const row = await decideBudgetRequest(supabase, String(p.request_id), 'approve', 'dashboard', { agency_id: agencyId, origin })
      return `Request approved; budget is now $${Number(row.requested_budget_usd).toFixed(2)}`
    }
    default:
      throw new Error(`Unknown action type ${(action as Action).type}`)
  }
}
