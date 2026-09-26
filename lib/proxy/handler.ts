import {
  resolveProjectKey,
  extractBearer,
  getCatalogApi,
  getWalletBalance,
  unauthorized,
  notFound,
  insufficientBalance,
} from '@/lib/proxy/auth'
import { appUrl } from '@/lib/config'
import { checkRateLimit } from '@/lib/proxy/rate-limit'
import { MIN_BUFFER_USD } from '@/lib/billing/calculate-cost'
import { resolveModelPrice, providerCost, userPrice, type TokenUsage, type PricingStatus } from '@/lib/billing/pricing'
import { getAdapter } from '@/lib/providers'
import { isModelShortcut, resolveModelShortcut } from '@/lib/billing/shortcuts'
import { teeSse } from '@/lib/proxy/stream'
import { startApifyRun } from '@/lib/proxy/async'
import { evaluatePolicy, blockedResponse } from '@/lib/proxy/policy'
import { runPostCallControls } from '@/lib/proxy/controls'
import { createServiceClient } from '@/lib/supabase/server'
import { raiseAlert } from '@/lib/notify'
import type { ResolvedKey } from '@/lib/proxy/auth'
import type { CatalogApi } from '@/lib/supabase/types'
import type { SupabaseClient } from '@supabase/supabase-js'

interface Priced {
  cost: number             // what the project is charged
  providerCost: number     // what key.one pays
  usage: TokenUsage | null
  status: PricingStatus | 'catalog'
}

// Shared by /api/proxy/[slug] and the SDK-style /api/proxy/[slug]/[...path]
export async function handleProxy(req: Request, slug: string, path?: string) {
  const start = Date.now()

  // 1. The project key is the only credential
  const apiKey = extractBearer(req)
  if (!apiKey) return unauthorized('Missing Authorization: Bearer <project key>')

  const caller = await resolveProjectKey(apiKey)
  if (!caller) return unauthorized('Invalid, revoked, or inactive project key')

  // 2. Rate limiting per key
  const { success: rateLimitOk, remaining, reset } = await checkRateLimit(`key:${caller.key_id}`)
  if (!rateLimitOk) {
    return Response.json(
      { error: 'Rate limit exceeded', retry_after: reset },
      { status: 429, headers: { 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': reset.toString() } }
    )
  }

  // 3. Catalog entry and its provider adapter
  const catalogApi = await getCatalogApi(slug)
  if (!catalogApi) return notFound(`Unknown API: ${slug}`)
  const adapter = getAdapter(catalogApi.provider)
  if (!adapter) return Response.json({ error: `No adapter for provider ${catalogApi.provider}` }, { status: 500 })

  // 4. Body
  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    // Empty body is fine for some endpoints
  }
  // Model shortcuts: "cheapest" | "balanced" | "best" become a concrete id
  let resolvedFrom: string | null = null
  if (isModelShortcut(body.model)) {
    const concrete = await resolveModelShortcut(catalogApi.provider, body.model)
    if (!concrete) return Response.json({ error: `No priced models for ${catalogApi.provider} to resolve "${body.model}"` }, { status: 400 })
    resolvedFrom = body.model
    body = { ...body, model: concrete }
  }
  const model = typeof body.model === 'string' ? body.model : null

  const supabase = createServiceClient()

  // 5. Spend controls, before the wallet so a blocked project never touches the balance
  const decision = await evaluatePolicy(supabase, caller, catalogApi, slug, body)
  if (!decision.allowed) {
    await supabase.from('api_calls').insert({
      ...callBase(caller, catalogApi, catalogApi.base_url, body, model),
      response_status: 403,
      duration_ms: Date.now() - start,
      status: 'blocked',
      blocked_reason: decision.reason,
    })
    return blockedResponse(decision, {
      'X-Project-ID': caller.project_id,
      'X-Client-ID': caller.client_id,
      'X-RateLimit-Remaining': remaining.toString(),
    })
  }

  // 6. Agency wallet
  const balance = await getWalletBalance(caller.agency_id)
  const isAsync = catalogApi.execution_mode === 'async'
  if (catalogApi.pricing_model === 'per_token' || isAsync) {
    if (balance < MIN_BUFFER_USD) return insufficientBalance(balance)
  } else if (balance < (catalogApi.price_per_call ?? 0)) {
    return insufficientBalance(balance)
  }

  const postCtx = {
    origin: appUrl(new URL(req.url).origin),
    before: { project_spent: decision.project_spent_usd, client_spent: decision.client_spent_usd },
  }

  const baseHeaders: Record<string, string> = {
    'X-RateLimit-Remaining': remaining.toString(),
    'X-Project-ID': caller.project_id,
    'X-Client-ID': caller.client_id,
  }
  if (resolvedFrom && model) baseHeaders['X-Model-Resolved'] = `${resolvedFrom} -> ${model}`

  // 6b. Async providers: start the run, return 202, bill on poll
  if (isAsync) {
    try {
      const { callId, runId } = await startApifyRun(catalogApi, body, caller, supabase)
      return Response.json(
        {
          run_id: runId,
          call_id: callId,
          status: 'RUNNING',
          poll_url: `/api/proxy/${slug}/runs/${runId}`,
          message: 'Run started. Poll poll_url to retrieve results.',
        },
        { status: 202, headers: { ...baseHeaders, 'X-Call-ID': callId, 'X-Balance-Remaining': balance.toFixed(6) } }
      )
    } catch (err) {
      return Response.json({ error: 'Failed to start async run', detail: String(err) }, { status: 502 })
    }
  }

  // 7. Forward to the provider with key.one's credentials
  const externalUrl = adapter.buildUrl(catalogApi, path)
  const outbound = adapter.prepareBody ? adapter.prepareBody(body) : body
  const isStream = adapter.wantsStream?.(body) ?? false

  let upstream: Response
  try {
    upstream = await fetch(externalUrl, {
      method: 'POST',
      headers: adapter.buildHeaders(catalogApi, req.headers),
      body: JSON.stringify(outbound),
    })
  } catch (err) {
    return Response.json({ error: 'Upstream API unreachable', detail: String(err) }, { status: 502 })
  }

  const budgetHeaders = (cost: number) => {
    const h: Record<string, string> = {}
    if (caller.project.monthly_budget_usd !== null) {
      h['X-Project-Budget-Remaining'] =
        Math.max(0, Number(caller.project.monthly_budget_usd) - decision.project_spent_usd - cost).toFixed(6)
    }
    if (caller.client.monthly_budget_usd !== null) {
      h['X-Client-Budget-Remaining'] =
        Math.max(0, Number(caller.client.monthly_budget_usd) - decision.client_spent_usd - cost).toFixed(6)
    }
    return h
  }

  // 8a. Streaming: log a pending row now (so the client gets X-Call-ID),
  //     pass the bytes through, and settle cost when the stream ends.
  if (isStream && upstream.ok && upstream.body) {
    const { data: pending } = await supabase
      .from('api_calls')
      .insert({
        ...callBase(caller, catalogApi, externalUrl, body, model),
        response_status: upstream.status,
        status: 'pending',
        is_stream: true,
      })
      .select('id')
      .single()
    const callId = pending?.id ?? null

    const stream = teeSse(upstream.body, async events => {
      const usage = adapter.usageFromSse?.(events) ?? null
      const priced = await priceCall(catalogApi, model, usage, null)
      await settleCall(supabase, caller, catalogApi, callId, {
        ...priced,
        duration_ms: Date.now() - start,
        response_status: upstream.status,
        balance,
      }, postCtx)
    })

    const headers: Record<string, string> = {
      ...baseHeaders,
      'Content-Type': upstream.headers.get('content-type') ?? 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    }
    if (callId) headers['X-Call-ID'] = callId
    return new Response(stream, { status: upstream.status, headers })
  }

  // 8b. Buffered response
  const duration = Date.now() - start
  const data = await upstream.json().catch(() => ({})) as Record<string, unknown>

  let priced: Priced = { cost: 0, providerCost: 0, usage: null, status: 'catalog' }
  if (upstream.ok) {
    const usage = catalogApi.pricing_model === 'per_token' ? (adapter.usageFromJson?.(data) ?? null) : null
    priced = await priceCall(catalogApi, model, usage, data, adapter.resultCount)
  }

  const { data: row } = await supabase
    .from('api_calls')
    .insert({
      ...callBase(caller, catalogApi, externalUrl, body, model),
      response_status: upstream.status,
      duration_ms: duration,
      status: upstream.ok ? 'completed' : 'failed',
    })
    .select('id')
    .single()
  const callId = row?.id ?? null

  if (upstream.ok) {
    await settleCall(supabase, caller, catalogApi, callId, {
      ...priced,
      duration_ms: duration,
      response_status: upstream.status,
      balance,
    }, postCtx)
  }

  const headers: Record<string, string> = {
    ...baseHeaders,
    ...budgetHeaders(priced.cost),
    'X-Cost-USD': priced.cost.toFixed(6),
    'X-Balance-Remaining': (balance - priced.cost).toFixed(6),
    'X-Pricing-Status': priced.status,
  }
  if (callId) headers['X-Call-ID'] = callId
  if (priced.usage) {
    headers['X-Tokens-Used'] = `${priced.usage.input_tokens + (priced.usage.cached_input_tokens ?? 0)}+${priced.usage.output_tokens}`
  }

  return Response.json(data, { status: upstream.status, headers })
}

// ------------------------------------------------------------
// helpers
// ------------------------------------------------------------

function callBase(caller: ResolvedKey, api: CatalogApi, endpoint: string, body: Record<string, unknown>, model: string | null) {
  return {
    agency_id: caller.agency_id,
    client_id: caller.client_id,
    project_id: caller.project_id,
    project_key_id: caller.key_id,
    catalog_api_id: api.id,
    endpoint,
    request_payload: sanitizePayload(body),
    cost_usd: 0,
    model,
  }
}

// Price a successful call. Unknown models fall back to the provider's '*'
// row so nothing is ever free by accident; the status says how it was priced.
async function priceCall(
  api: CatalogApi,
  model: string | null,
  usage: TokenUsage | null,
  data: Record<string, unknown> | null,
  resultCount?: (json: unknown) => number
): Promise<Priced> {
  if (api.pricing_model === 'per_token') {
    if (!usage) return { cost: 0, providerCost: 0, usage: null, status: 'unknown' }
    const price = await resolveModelPrice(api.provider, model ?? '')
    if (!price) return { cost: 0, providerCost: 0, usage, status: 'unknown' }
    const pc = providerCost(price, usage)
    return { cost: userPrice(pc), providerCost: pc, usage, status: price.status }
  }
  if (api.pricing_model === 'per_result') {
    const n = data && resultCount ? resultCount(data) : 0
    const unit = api.price_per_result ?? 0
    return { cost: n * unit, providerCost: n * (api.cost_per_call ?? unit / 1.3), usage: null, status: 'catalog' }
  }
  const cost = api.price_per_call ?? 0
  return { cost, providerCost: api.cost_per_call ?? cost, usage: null, status: 'catalog' }
}

// Finalize the log row and deduct the wallet. Never throws into the response path.
async function settleCall(
  supabase: SupabaseClient,
  caller: ResolvedKey,
  api: CatalogApi,
  callId: string | null,
  s: Priced & { duration_ms: number; response_status: number; balance: number },
  after?: { origin: string; before: { project_spent: number; client_spent: number } }
) {
  try {
    if (callId) {
      await supabase
        .from('api_calls')
        .update({
          status: 'completed',
          cost_usd: s.cost,
          provider_cost_usd: s.providerCost,
          pricing_status: s.status,
          duration_ms: s.duration_ms,
          response_status: s.response_status,
          input_tokens: s.usage?.input_tokens ?? null,
          output_tokens: s.usage?.output_tokens ?? null,
          cached_input_tokens: s.usage?.cached_input_tokens ?? null,
        })
        .eq('id', callId)
    }

    if (s.cost > 0) {
      await supabase.rpc('deduct_wallet', {
        p_agency_id: caller.agency_id,
        p_amount: s.cost,
        p_description: `${api.slug} · ${caller.client.name} / ${caller.project.name}`,
        p_api_call_id: callId,
      })
      const newBalance = s.balance - s.cost
      if (newBalance < 5 && after) {
        await raiseAlert(supabase, {
          agency_id: caller.agency_id,
          kind: 'low_balance',
          scope: 'agency',
          scope_id: caller.agency_id,
          dedupe_key: `low_balance:${new Date().toISOString().slice(0, 10)}`,   // once a day
          title: `Wallet is running low: $${newBalance.toFixed(2)} left`,
          body: 'Every project key stops working when the balance reaches $0. Top up to keep agents running.',
          data: { balance_usd: newBalance, links: { 'Add funds': `${appUrl(after.origin)}/dashboard/wallet` } },
        })
      }
      if (after) await runPostCallControls(supabase, caller, after.origin, after.before, s.cost)
    }
  } catch (err) {
    console.error('Failed to settle call:', err)
  }
}

function sanitizePayload(body: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...body }
  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization']
  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) sanitized[key] = '[redacted]'
  }
  return sanitized
}
