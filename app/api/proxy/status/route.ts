import { resolveProjectKey, extractBearer, getWalletBalance, unauthorized } from '@/lib/proxy/auth'
import { getSpendSnapshot, nextMonthStart } from '@/lib/proxy/policy'
import { createServiceClient } from '@/lib/supabase/server'
import { apiPaused } from '@/lib/config'

export const runtime = 'nodejs'

// GET /api/proxy/status — what an agent can learn about its own limits
// with nothing but its project key. Lets it check before spending and
// explain a block instead of retrying blindly.
export async function GET(req: Request) {
  const paused = apiPaused()
  if (paused) return paused
  const apiKey = extractBearer(req)
  if (!apiKey) return unauthorized('Missing Authorization: Bearer <project key>')

  const caller = await resolveProjectKey(apiKey)
  if (!caller) return unauthorized('Invalid, revoked, or inactive project key')

  const supabase = createServiceClient()
  const [spend, balance] = await Promise.all([
    getSpendSnapshot(supabase, caller.project_id, caller.client_id),
    getWalletBalance(caller.agency_id),
  ])

  const remaining = (limit: number | null, spent: number) =>
    limit === null ? null : Math.max(0, Number(limit) - spent)

  return Response.json({
    project: {
      id: caller.project_id,
      name: caller.project.name,
      month_spent_usd: spend.project_spent,
      monthly_budget_usd: caller.project.monthly_budget_usd,
      remaining_usd: remaining(caller.project.monthly_budget_usd, spend.project_spent),
      max_cost_per_call_usd: caller.project.max_cost_per_call_usd,
      allowed_apis: caller.project.allowed_apis,
    },
    client: {
      id: caller.client_id,
      name: caller.client.name,
      month_spent_usd: spend.client_spent,
      monthly_budget_usd: caller.client.monthly_budget_usd,
      remaining_usd: remaining(caller.client.monthly_budget_usd, spend.client_spent),
    },
    wallet_balance_usd: balance,
    budgets_reset_at: nextMonthStart(),
  })
}
