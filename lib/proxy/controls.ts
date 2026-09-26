import type { SupabaseClient } from '@supabase/supabase-js'
import type { ResolvedKey } from '@/lib/proxy/auth'
import { raiseAlert } from '@/lib/notify'

const THRESHOLDS = [50, 80, 100]

function monthKey(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

// Called after a call is settled. Cheap by design: two sums and a few inserts
// that no-op when the dedupe key exists.
export async function runPostCallControls(
  supabase: SupabaseClient,
  caller: ResolvedKey,
  origin: string,
  before: { project_spent: number; client_spent: number },
  cost: number
): Promise<void> {
  await Promise.all([
    checkThresholds(supabase, caller, origin, 'project', caller.project_id, caller.project.name,
      caller.project.monthly_budget_usd, before.project_spent, before.project_spent + cost),
    checkThresholds(supabase, caller, origin, 'client', caller.client_id, caller.client.name,
      caller.client.monthly_budget_usd, before.client_spent, before.client_spent + cost),
    checkSpike(supabase, caller, origin),
  ]).catch(err => console.error('[controls] post-call checks failed:', err))
}

async function checkThresholds(
  supabase: SupabaseClient,
  caller: ResolvedKey,
  origin: string,
  scope: 'project' | 'client',
  scopeId: string,
  name: string,
  budget: number | null,
  before: number,
  after: number
) {
  if (budget === null || budget === undefined || Number(budget) <= 0) return
  const b = Number(budget)
  for (const pct of THRESHOLDS) {
    const line = (b * pct) / 100
    if (before < line && after >= line) {
      const href = scope === 'project' ? `${origin}/dashboard/projects/${scopeId}` : `${origin}/dashboard/clients/${scopeId}`
      await raiseAlert(supabase, {
        agency_id: caller.agency_id,
        kind: 'budget_threshold',
        scope,
        scope_id: scopeId,
        dedupe_key: `${scope}:${scopeId}:${pct}:${monthKey()}`,
        title: `${scope === 'project' ? 'Project' : 'Client'} "${name}" is at ${pct}% of its $${b.toFixed(2)} monthly budget`,
        body:
          `Spent $${after.toFixed(4)} so far this month.` +
          (pct >= 100 ? ' Further calls are blocked until the budget is raised or the month resets.' : ''),
        data: { pct, budget_usd: b, spent_usd: after, client: caller.client.name, project: caller.project.name, links: { 'Open in key.one': href } },
      })
    }
  }
}

interface SpendWindow { last_hour: number | string; prev_week: number | string; history_hours: number | string }

async function checkSpike(supabase: SupabaseClient, caller: ResolvedKey, origin: string) {
  const { data: agency } = await supabase
    .from('agencies')
    .select('spike_multiplier, spike_floor_usd')
    .eq('id', caller.agency_id)
    .single()
  const multiplier = Number(agency?.spike_multiplier ?? 10)
  const floor = Number(agency?.spike_floor_usd ?? 10)

  const { data } = await supabase.rpc('key_spend_window', { p_key_id: caller.key_id }).single()
  const w = data as SpendWindow | null
  if (!w) return

  const lastHour = Number(w.last_hour)
  if (lastHour < floor) return

  const hours = Math.max(1, Number(w.history_hours))
  const baseline = Number(w.prev_week) / hours
  if (lastHour <= multiplier * baseline) return

  const reason = `Spent $${lastHour.toFixed(2)} in the last hour, ${baseline > 0 ? `${(lastHour / baseline).toFixed(0)}× its hourly baseline of $${baseline.toFixed(4)}` : 'with no prior history'} (limit: ${multiplier}× and at least $${floor.toFixed(2)})`

  const { data: frozen } = await supabase
    .from('project_keys')
    .update({ frozen_at: new Date().toISOString(), frozen_reason: reason })
    .eq('id', caller.key_id)
    .is('frozen_at', null)
    .select('id, key_prefix')
    .maybeSingle()
  if (!frozen) return   // already frozen

  await raiseAlert(supabase, {
    agency_id: caller.agency_id,
    kind: 'key_frozen',
    scope: 'key',
    scope_id: caller.key_id,
    title: `Key ${frozen.key_prefix}… frozen on "${caller.client.name} / ${caller.project.name}"`,
    body: `${reason}. Other keys and projects keep working. Unfreeze from the project page once you've checked what it was doing.`,
    data: { last_hour_usd: lastHour, baseline_hourly_usd: baseline, links: { 'Review project': `${origin}/dashboard/projects/${caller.project_id}` } },
  })
}
