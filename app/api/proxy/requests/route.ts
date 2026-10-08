import { resolveProjectKey, extractBearer, unauthorized } from '@/lib/proxy/auth'
import { appUrl, apiPaused } from '@/lib/config'
import { createServiceClient } from '@/lib/supabase/server'
import { createBudgetRequest } from '@/lib/requests'

export const runtime = 'nodejs'

// POST /api/proxy/requests — an agent asks for more budget with its project key
export async function POST(req: Request) {
  const paused = apiPaused()
  if (paused) return paused
  const apiKey = extractBearer(req)
  if (!apiKey) return unauthorized('Missing Authorization: Bearer <project key>')
  const caller = await resolveProjectKey(apiKey)
  if (!caller) return unauthorized('Invalid, revoked, or inactive project key')

  const body = await req.json().catch(() => ({}))
  try {
    const row = await createBudgetRequest(createServiceClient(), {
      agency_id: caller.agency_id,
      project_id: caller.project_id,
      project_key_id: caller.key_id,
      requested_by: 'agent',
      requested_budget_usd: Number(body.requested_budget_usd),
      reason: typeof body.reason === 'string' ? body.reason.slice(0, 500) : undefined,
      origin: appUrl(new URL(req.url).origin),
    })
    return Response.json(
      {
        ...row,
        message: row.status === 'approved'
          ? `Approved automatically. Budget is now $${Number(row.requested_budget_usd).toFixed(2)}/month.`
          : 'Request filed. The agency owner has been notified; poll GET /api/proxy/requests to see the decision.',
      },
      { status: 201 }
    )
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 400 })
  }
}

// GET /api/proxy/requests — this project's requests, newest first
export async function GET(req: Request) {
  const paused = apiPaused()
  if (paused) return paused
  const apiKey = extractBearer(req)
  if (!apiKey) return unauthorized('Missing Authorization: Bearer <project key>')
  const caller = await resolveProjectKey(apiKey)
  if (!caller) return unauthorized('Invalid, revoked, or inactive project key')

  const { data } = await createServiceClient()
    .from('budget_requests')
    .select('id, requested_by, current_budget_usd, requested_budget_usd, reason, status, auto_approved, decided_at, created_at')
    .eq('project_id', caller.project_id)
    .order('created_at', { ascending: false })
    .limit(20)
  return Response.json(data ?? [])
}
