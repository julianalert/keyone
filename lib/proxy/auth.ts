import { createServiceClient } from '@/lib/supabase/server'
import { hashProjectKey } from '@/lib/keys'
import { appUrl } from '@/lib/config'
import type { CatalogApi } from '@/lib/supabase/types'

// Everything the proxy needs to know about a caller, resolved from the key alone.
export interface ResolvedKey {
  key_id: string
  key_frozen_reason: string | null   // set when the key is frozen by the spike control
  project_id: string
  client_id: string
  agency_id: string
  project: {
    id: string
    name: string
    monthly_budget_usd: number | null
    max_cost_per_call_usd: number | null
    allowed_apis: string[] | null
    allowed_models: string[] | null
  }
  client: { id: string; name: string; monthly_budget_usd: number | null }
}

interface KeyRow {
  id: string
  project_id: string
  agency_id: string
  revoked_at: string | null
  frozen_at: string | null
  frozen_reason: string | null
  projects: {
    id: string
    name: string
    client_id: string
    monthly_budget_usd: number | null
    max_cost_per_call_usd: number | null
    allowed_apis: string[] | null
    allowed_models: string[] | null
    is_active: boolean
    clients: {
      id: string
      name: string
      monthly_budget_usd: number | null
      is_active: boolean
    }
  }
}

export async function resolveProjectKey(apiKey: string): Promise<ResolvedKey | null> {
  if (!apiKey) return null

  const supabase = createServiceClient()

  const { data } = await supabase
    .from('project_keys')
    .select(
      'id, project_id, agency_id, revoked_at, frozen_at, frozen_reason, ' +
      'projects!inner(id, name, client_id, monthly_budget_usd, max_cost_per_call_usd, allowed_apis, allowed_models, is_active, ' +
      'clients!inner(id, name, monthly_budget_usd, is_active))'
    )
    .eq('key_hash', hashProjectKey(apiKey))
    .maybeSingle()

  const row = data as unknown as KeyRow | null
  if (!row || row.revoked_at) return null
  if (!row.projects.is_active || !row.projects.clients.is_active) return null

  // Best-effort last-used stamp; never block the request on it
  void supabase
    .from('project_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', row.id)
    .then(() => undefined, () => undefined)

  return {
    key_id: row.id,
    key_frozen_reason: row.frozen_at ? (row.frozen_reason ?? 'frozen') : null,
    project_id: row.projects.id,
    client_id: row.projects.clients.id,
    agency_id: row.agency_id,
    project: {
      id: row.projects.id,
      name: row.projects.name,
      monthly_budget_usd: row.projects.monthly_budget_usd,
      max_cost_per_call_usd: row.projects.max_cost_per_call_usd,
      allowed_apis: row.projects.allowed_apis,
      allowed_models: row.projects.allowed_models,
    },
    client: {
      id: row.projects.clients.id,
      name: row.projects.clients.name,
      monthly_budget_usd: row.projects.clients.monthly_budget_usd,
    },
  }
}

export function extractBearer(req: Request): string {
  const header = req.headers.get('authorization') ?? ''
  if (header.startsWith('Bearer ')) return header.slice(7).trim()
  // Anthropic SDK convention
  return (req.headers.get('x-api-key') ?? '').trim()
}

export async function getCatalogApi(slug: string): Promise<CatalogApi | null> {
  const supabase = createServiceClient()

  const { data } = await supabase
    .from('catalog_apis')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  return data
}

export async function getWalletBalance(agencyId: string): Promise<number> {
  const supabase = createServiceClient()

  const { data } = await supabase
    .from('wallets')
    .select('balance_usd')
    .eq('agency_id', agencyId)
    .single()

  return Number(data?.balance_usd ?? 0)
}

export function unauthorized(message = 'Unauthorized') {
  return Response.json({ error: message }, { status: 401 })
}

export function notFound(message = 'API not found') {
  return Response.json({ error: message }, { status: 404 })
}

// `estimate` is set when the wallet is not empty but cannot cover this call
export function insufficientBalance(balance: number, estimate?: number) {
  const topUp = `${appUrl('https://getkeyone.com')}/dashboard/wallet`
  return Response.json(
    {
      error: 'Insufficient balance',
      balance_usd: balance,
      ...(estimate === undefined ? {} : { estimated_call_usd: estimate }),
      message: estimate === undefined
        ? `Top up your wallet at ${topUp}`
        : `This call could cost up to $${estimate.toFixed(4)} and the wallet holds $${balance.toFixed(4)}. Lower max_tokens, use a cheaper model, or top up at ${topUp}`,
    },
    { status: 402 }
  )
}
