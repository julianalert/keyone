import { resolveProjectKey, extractBearer, getCatalogApi, getWalletBalance } from '@/lib/proxy/auth'
import {
  getApifyRunStatus,
  getApifyDatasetItems,
  isSuccessStatus,
  isTerminalStatus,
} from '@/lib/proxy/async'
import { createServiceClient } from '@/lib/supabase/server'
import { inngest } from '@/lib/inngest/client'

export const runtime = 'nodejs'

// GET /api/proxy/:slug/runs/:runId — poll an async run for completion
export async function GET(
  req: Request,
  { params }: { params: { slug: string; runId: string } }
) {
  const { slug, runId } = params

  // 1. Auth: any active key of the project that started the run may poll it
  const apiKey = extractBearer(req)
  if (!apiKey) {
    return Response.json({ error: 'Missing Authorization: Bearer <project key>' }, { status: 401 })
  }

  const caller = await resolveProjectKey(apiKey)
  if (!caller) {
    return Response.json({ error: 'Invalid, revoked, or inactive project key' }, { status: 401 })
  }

  // 2. Verify the catalog API exists and is async
  const catalogApi = await getCatalogApi(slug)
  if (!catalogApi) {
    return Response.json({ error: `Unknown API: ${slug}` }, { status: 404 })
  }
  if (catalogApi.execution_mode !== 'async') {
    return Response.json({ error: 'This API does not use async runs' }, { status: 400 })
  }

  // 3. Look up the pending api_calls record by external_run_id
  const supabase = createServiceClient()
  const { data: callRecord, error: callError } = await supabase
    .from('api_calls')
    .select('id, status, cost_usd, project_id')
    .eq('external_run_id', runId)
    .single()

  if (callError || !callRecord) {
    return Response.json({ error: 'Run not found', run_id: runId }, { status: 404 })
  }

  // Verify ownership: the run must belong to the caller's project
  if (callRecord.project_id !== caller.project_id) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // 4. Already completed — idempotent: return 200 without re-charging
  if (callRecord.status === 'completed') {
    return Response.json(
      { status: 'SUCCEEDED', run_id: runId, call_id: callRecord.id, already_billed: true },
      {
        status: 200,
        headers: {
          'X-Cost-USD': Number(callRecord.cost_usd).toFixed(6),
          'X-Call-ID': callRecord.id,
        },
      }
    )
  }

  // 5. Already failed — return the terminal error without polling Apify again
  if (callRecord.status === 'failed') {
    return Response.json(
      { error: 'Run failed', status: 'FAILED', run_id: runId },
      { status: 500 }
    )
  }

  // 6. Still pending — poll Apify for current status
  let runStatus
  try {
    runStatus = await getApifyRunStatus(runId)
  } catch (err) {
    return Response.json({ error: 'Failed to fetch run status', detail: String(err) }, { status: 502 })
  }

  // 7. Still running — tell the caller to come back later
  if (!isTerminalStatus(runStatus.status)) {
    return Response.json(
      {
        status: runStatus.status,
        run_id: runId,
        call_id: callRecord.id,
        started_at: runStatus.startedAt,
        poll_url: `/api/proxy/${slug}/runs/${runId}`,
        message: 'Run is still in progress. Poll again in a few seconds.',
      },
      { status: 202 }
    )
  }

  // 8. Run failed/aborted — mark the call record and return error
  if (!isSuccessStatus(runStatus.status)) {
    await supabase
      .from('api_calls')
      .update({ status: 'failed', response_status: 500 })
      .eq('id', callRecord.id)

    return Response.json(
      { error: `Run ended with status: ${runStatus.status}`, run_id: runId },
      { status: 500 }
    )
  }

  // 9. SUCCEEDED — fetch results, calculate cost, deduct wallet
  if (!runStatus.defaultDatasetId) {
    return Response.json({ error: 'Run succeeded but no dataset found' }, { status: 502 })
  }

  let items: unknown[]
  try {
    items = await getApifyDatasetItems(runStatus.defaultDatasetId)
  } catch (err) {
    return Response.json({ error: 'Failed to fetch dataset', detail: String(err) }, { status: 502 })
  }

  const resultCount = items.length
  const pricePerResult = Number(catalogApi.price_per_result ?? 0)
  const cost = resultCount * pricePerResult

  // Duration: time from run start to finish
  const durationMs = runStatus.startedAt && runStatus.finishedAt
    ? new Date(runStatus.finishedAt).getTime() - new Date(runStatus.startedAt).getTime()
    : null

  // 10. Atomic wallet deduction + update api_calls record
  try {
    // Update the call record first
    await supabase
      .from('api_calls')
      .update({
        status: 'completed',
        cost_usd: cost,
        provider_cost_usd: resultCount * Number(catalogApi.cost_per_call ?? pricePerResult / 1.3),
        pricing_status: 'catalog',
        response_status: 200,
        duration_ms: durationMs,
      })
      .eq('id', callRecord.id)

    if (cost > 0) {
      // Atomic deduction via DB function
      await supabase.rpc('deduct_wallet', {
        p_agency_id: caller.agency_id,
        p_amount: cost,
        p_description: `${catalogApi.slug} · ${caller.client.name} / ${caller.project.name} (${resultCount} results)`,
        p_api_call_id: callRecord.id,
      })

      // Budget alert if balance drops below threshold
      const balance = await getWalletBalance(caller.agency_id)
      if (balance < 5) {
        await inngest.send({
          name: 'wallet/low-balance',
          data: { agency_id: caller.agency_id, balance, threshold: 5 },
        })
      }
    }
  } catch (err) {
    console.error('Failed to deduct wallet for async run:', err)
    // Don't block — return results even if billing failed (can be reconciled)
  }

  // 11. Return results with cost headers
  const balance = await getWalletBalance(caller.agency_id)

  return Response.json(items, {
    status: 200,
    headers: {
      'X-Cost-USD': cost.toFixed(6),
      'X-Balance-Remaining': balance.toFixed(6),
      'X-Call-ID': callRecord.id,
      'X-Result-Count': resultCount.toString(),
    },
  })
}
