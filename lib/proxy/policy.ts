import type { SupabaseClient } from '@supabase/supabase-js'
import type { ResolvedKey } from '@/lib/proxy/auth'
import type { CatalogApi } from '@/lib/supabase/types'
import { estimateCallCost } from '@/lib/billing/calculate-cost'

// A control is one limit the agency configured. When a call trips one,
// the response carries the full snapshot so an agent can explain it or
// ask for more budget instead of retrying blindly.
export type ControlType =
  | 'KEY_FROZEN'
  | 'PROJECT_MONTHLY_BUDGET'
  | 'CLIENT_MONTHLY_BUDGET'
  | 'PROJECT_CALL_CAP'
  | 'PROJECT_ALLOWED_APIS'
  | 'PROJECT_ALLOWED_MODELS'

export interface ControlSnapshot {
  type: ControlType
  scope: { project_id: string; project_name: string; client_id: string; client_name: string }
  detail?: string
  limit_usd?: number
  spent_usd?: number
  remaining_usd?: number
  estimated_call_usd?: number
  allowed_apis?: string[]
  requested_api?: string
  allowed_models?: string[]
  requested_model?: string
  resets_at?: string
}

export interface PolicyDecision {
  allowed: boolean
  reason: string | null
  controls: ControlSnapshot[]
  project_spent_usd: number
  client_spent_usd: number
}

export function nextMonthStart(now = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString()
}

export async function getSpendSnapshot(
  supabase: SupabaseClient,
  projectId: string,
  clientId: string
): Promise<{ project_spent: number; client_spent: number }> {
  const { data } = await supabase
    .rpc('spend_snapshot', { p_project_id: projectId, p_client_id: clientId })
    .single()
  const row = data as { project_spent: number | string; client_spent: number | string } | null
  return {
    project_spent: Number(row?.project_spent ?? 0),
    client_spent: Number(row?.client_spent ?? 0),
  }
}

export async function evaluatePolicy(
  supabase: SupabaseClient,
  caller: ResolvedKey,
  catalogApi: CatalogApi,
  slug: string,
  body: Record<string, unknown>
): Promise<PolicyDecision> {
  const scope = {
    project_id: caller.project_id,
    project_name: caller.project.name,
    client_id: caller.client_id,
    client_name: caller.client.name,
  }
  const resets_at = nextMonthStart()
  const controls: ControlSnapshot[] = []

  // 0. Frozen key (spike control). Nothing else matters until it's unfrozen.
  if (caller.key_frozen_reason) {
    controls.push({ type: 'KEY_FROZEN', scope, detail: caller.key_frozen_reason })
    return { allowed: false, reason: 'key_frozen', controls, project_spent_usd: 0, client_spent_usd: 0 }
  }

  // 1. Allowed tools
  const allowed = caller.project.allowed_apis
  if (allowed && allowed.length > 0 && !allowed.includes(slug)) {
    controls.push({ type: 'PROJECT_ALLOWED_APIS', scope, allowed_apis: allowed, requested_api: slug })
  }

  // 1b. Allowed models (exact id or prefix match, so dated ids still pass)
  const allowedModels = caller.project.allowed_models
  const requestedModel = typeof body.model === 'string' ? body.model : null
  if (allowedModels && allowedModels.length > 0 && requestedModel &&
      !allowedModels.some(m => requestedModel === m || requestedModel.startsWith(m + '-'))) {
    controls.push({ type: 'PROJECT_ALLOWED_MODELS', scope, allowed_models: allowedModels, requested_model: requestedModel })
  }

  // 2. Budgets, against month-to-date spend plus this call's known price
  const spend = await getSpendSnapshot(supabase, caller.project_id, caller.client_id)
  const estimate = await estimateCallCost(catalogApi, body)
  const projected = estimate ?? 0

  const projectBudget = caller.project.monthly_budget_usd
  if (projectBudget !== null && projectBudget !== undefined && spend.project_spent + projected > Number(projectBudget)) {
    controls.push({
      type: 'PROJECT_MONTHLY_BUDGET',
      scope,
      limit_usd: Number(projectBudget),
      spent_usd: spend.project_spent,
      remaining_usd: Math.max(0, Number(projectBudget) - spend.project_spent),
      estimated_call_usd: estimate ?? undefined,
      resets_at,
    })
  }

  const clientBudget = caller.client.monthly_budget_usd
  if (clientBudget !== null && clientBudget !== undefined && spend.client_spent + projected > Number(clientBudget)) {
    controls.push({
      type: 'CLIENT_MONTHLY_BUDGET',
      scope,
      limit_usd: Number(clientBudget),
      spent_usd: spend.client_spent,
      remaining_usd: Math.max(0, Number(clientBudget) - spend.client_spent),
      estimated_call_usd: estimate ?? undefined,
      resets_at,
    })
  }

  // 3. Per-call cap (only when we can estimate the call)
  const cap = caller.project.max_cost_per_call_usd
  if (cap !== null && cap !== undefined && estimate !== null && estimate > Number(cap)) {
    controls.push({ type: 'PROJECT_CALL_CAP', scope, limit_usd: Number(cap), estimated_call_usd: estimate })
  }

  return {
    allowed: controls.length === 0,
    reason: controls[0]?.type.toLowerCase() ?? null,
    controls,
    project_spent_usd: spend.project_spent,
    client_spent_usd: spend.client_spent,
  }
}

const MESSAGES: Record<ControlType, (c: ControlSnapshot) => string> = {
  KEY_FROZEN: c =>
    `This key was frozen by the spend-spike control: ${c.detail}. Ask the agency to unfreeze it from the project page.`,
  PROJECT_MONTHLY_BUDGET: c =>
    `Project "${c.scope.project_name}" has spent $${c.spent_usd?.toFixed(4)} of its $${c.limit_usd?.toFixed(2)} monthly budget.`,
  CLIENT_MONTHLY_BUDGET: c =>
    `Client "${c.scope.client_name}" has spent $${c.spent_usd?.toFixed(4)} of its $${c.limit_usd?.toFixed(2)} monthly budget.`,
  PROJECT_CALL_CAP: c =>
    `This call is estimated at $${c.estimated_call_usd?.toFixed(4)}, above the project's $${c.limit_usd?.toFixed(4)} per-call cap. Lower max_tokens or use a cheaper model.`,
  PROJECT_ALLOWED_APIS: c =>
    `Project "${c.scope.project_name}" may only call: ${c.allowed_apis?.join(', ')}.`,
  PROJECT_ALLOWED_MODELS: c =>
    `Project "${c.scope.project_name}" may only use models: ${c.allowed_models?.join(', ')} (requested ${c.requested_model}).`,
}

// 403 so SDKs don't retry. Body is stable and machine-readable.
export function blockedResponse(decision: PolicyDecision, extraHeaders: Record<string, string> = {}) {
  const first = decision.controls[0]
  return Response.json(
    {
      status: 'BLOCKED',
      error: 'blocked',
      reason: decision.reason,
      message: first ? MESSAGES[first.type](first) : 'Blocked by a spend control.',
      controls: decision.controls,
      hint:
        first?.type === 'PROJECT_MONTHLY_BUDGET' || first?.type === 'CLIENT_MONTHLY_BUDGET'
          ? 'You can request more budget: POST /api/proxy/requests with this key and {"requested_budget_usd": <amount>, "reason": "<why>"}. Small increases may be auto-approved; otherwise the agency owner gets an approve link.'
          : 'Ask the agency to change the limit in the key.one dashboard, or wait for resets_at.',
    },
    {
      status: 403,
      headers: { 'X-Blocked-Reason': decision.reason ?? 'blocked', ...extraHeaders },
    }
  )
}
