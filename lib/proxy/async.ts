import type { SupabaseClient } from '@supabase/supabase-js'
import type { CatalogApi } from '@/lib/supabase/types'
import type { ResolvedKey } from '@/lib/proxy/auth'

const APIFY_BASE = 'https://api.apify.com/v2'

function apifyToken() {
  return process.env.APIFY_TOKEN!
}

// ============================================================
// Start an async Apify run
// Inserts a pending api_calls row, does NOT deduct wallet.
// Returns { callId, runId } for the 202 response.
// ============================================================
export async function startApifyRun(
  catalogApi: CatalogApi,
  body: Record<string, unknown>,
  caller: ResolvedKey,
  supabase: SupabaseClient
): Promise<{ callId: string; runId: string }> {
  const startUrl = `${catalogApi.base_url}?token=${apifyToken()}`

  const apifyResponse = await fetch(startUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!apifyResponse.ok) {
    const err = await apifyResponse.text()
    throw new Error(`Apify run start failed (${apifyResponse.status}): ${err}`)
  }

  const { data: runData } = await apifyResponse.json() as {
    data: { id: string; status: string }
  }

  const runId = runData.id

  // Insert pending api_calls row — cost_usd is 0 until run completes
  const { data: callData, error } = await supabase
    .from('api_calls')
    .insert({
      agency_id: caller.agency_id,
      client_id: caller.client_id,
      project_id: caller.project_id,
      project_key_id: caller.key_id,
      catalog_api_id: catalogApi.id,
      endpoint: startUrl,
      request_payload: body,
      response_status: 202,
      cost_usd: 0,
      duration_ms: null,
      status: 'pending',
      external_run_id: runId,
    })
    .select('id')
    .single()

  if (error || !callData) {
    throw new Error(`Failed to create api_calls record: ${error?.message}`)
  }

  return { callId: callData.id, runId }
}

// ============================================================
// Poll a run's status from Apify
// ============================================================
export interface ApifyRunStatus {
  status: 'READY' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'ABORTED' | 'TIMING-OUT' | 'TIMED-OUT'
  defaultDatasetId: string | null
  startedAt: string | null
  finishedAt: string | null
}

export async function getApifyRunStatus(runId: string): Promise<ApifyRunStatus> {
  const url = `${APIFY_BASE}/actor-runs/${runId}?token=${apifyToken()}`

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Apify run status fetch failed (${res.status})`)
  }

  const { data } = await res.json() as {
    data: {
      status: ApifyRunStatus['status']
      defaultDatasetId: string | null
      startedAt: string | null
      finishedAt: string | null
    }
  }

  return {
    status: data.status,
    defaultDatasetId: data.defaultDatasetId ?? null,
    startedAt: data.startedAt ?? null,
    finishedAt: data.finishedAt ?? null,
  }
}

// ============================================================
// Fetch dataset items once a run has SUCCEEDED
// ============================================================
export async function getApifyDatasetItems(datasetId: string): Promise<unknown[]> {
  const url = `${APIFY_BASE}/datasets/${datasetId}/items?token=${apifyToken()}&clean=true`

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Apify dataset fetch failed (${res.status})`)
  }

  const items = await res.json()
  return Array.isArray(items) ? items : []
}

// ============================================================
// Terminal statuses — run will not change anymore
// ============================================================
export function isTerminalStatus(status: ApifyRunStatus['status']): boolean {
  return ['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)
}

export function isSuccessStatus(status: ApifyRunStatus['status']): boolean {
  return status === 'SUCCEEDED'
}
