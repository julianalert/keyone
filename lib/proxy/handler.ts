import {
  resolveProjectKey,
  extractBearer,
  getCatalogApi,
  getWalletBalance,
  unauthorized,
  notFound,
  insufficientBalance,
} from '@/lib/proxy/auth'
import { appUrl, apiPaused } from '@/lib/config'
import { checkRateLimit } from '@/lib/proxy/rate-limit'
import { MIN_BUFFER_USD, estimateCallCost, estimateUsage, roughTokens } from '@/lib/billing/calculate-cost'
import { resolveModelPrice, providerCost, toolFees, userPrice, type TokenUsage, type PricingStatus } from '@/lib/billing/pricing'
import { chargeWallet } from '@/lib/billing/wallet'
import { getAdapter } from '@/lib/providers'
import { endpointOf, type EndpointBilling, type UsageContext } from '@/lib/providers/types'
import { isModelShortcut, resolveModelShortcut } from '@/lib/billing/shortcuts'
import { teeSse, streamedText } from '@/lib/proxy/stream'
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
  // How the price was arrived at; 'estimated' = the response carried no usage
  status: PricingStatus | 'catalog' | 'estimated' | 'free'
  model: string | null     // the model the call was priced as (may come from the response)
}

// The proxy routes run with maxDuration = 300. A stream still going by then is
// cut and settled here, before the platform kills the function mid-stream.
const STREAM_BUDGET_MS = 285_000

// Shared by /api/proxy/[slug] and the SDK-style /api/proxy/[slug]/[...path]
export async function handleProxy(req: Request, slug: string, path?: string) {
  const paused = apiPaused()
  if (paused) return paused
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
  if (!adapter.configured()) {
    return Response.json(
      { error: 'provider_not_configured', message: `${catalogApi.name} is not connected on this key.one instance yet.` },
      { status: 503 }
    )
  }

  const baseHeaders: Record<string, string> = {
    'X-RateLimit-Remaining': remaining.toString(),
    'X-Project-ID': caller.project_id,
    'X-Client-ID': caller.client_id,
  }

  // 3b. GET passthrough for model listings: nothing to bill. Nothing else is
  //     readable with key.one's credentials (files, batches and stored
  //     responses on the provider account are not scoped to one agency).
  if (req.method === 'GET') {
    if (!/^models(\/.+)?$/.test(endpointOf(path))) return unsupported(catalogApi.name, 'GET', path)
    const headers = adapter.buildHeaders(catalogApi, req.headers)
    delete headers['Content-Type']
    let upstream: Response
    try {
      upstream = await fetch(adapter.buildUrl(catalogApi, path), { headers })
    } catch (err) {
      return Response.json({ error: 'Upstream API unreachable', detail: String(err) }, { status: 502 })
    }
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { ...baseHeaders, 'Content-Type': upstream.headers.get('content-type') ?? 'application/json' },
    })
  }

  // 4. Body: JSON, or multipart for uploads (audio transcription, image edits)
  let body: Record<string, unknown> = {}
  let form: FormData | null = null
  if ((req.headers.get('content-type') ?? '').includes('multipart/form-data')) {
    try {
      form = await req.formData()
      form.forEach((v, k) => { body[k] = typeof v === 'string' ? coerceField(v) : `[file ${v.name}, ${v.size} bytes]` })
    } catch (err) {
      return Response.json({ error: 'Malformed multipart body', detail: String(err) }, { status: 400 })
    }
  } else {
    try {
      body = await req.json()
    } catch {
      // Empty body is fine for some endpoints
    }
  }

  // 4b. Only endpoints the adapter can account for. An unknown path would
  //     spend key.one's credentials on a call nobody is billed for.
  const billing = adapter.endpoint ? adapter.endpoint(path ?? null, body) : (path ? null : 'metered')
  if (!billing) return unsupported(catalogApi.name, 'POST', path)

  // Model shortcuts: "cheapest" | "balanced" | "best" become a concrete id
  let resolvedFrom: string | null = null
  if (isModelShortcut(body.model)) {
    const concrete = await resolveModelShortcut(catalogApi.provider, body.model)
    if (!concrete) return Response.json({ error: `No priced models for ${catalogApi.provider} to resolve "${body.model}"` }, { status: 400 })
    resolvedFrom = body.model
    body = { ...body, model: concrete }
    form?.set('model', concrete)
  }
  const ctx: UsageContext = { path: path ?? null, body }
  const model = typeof body.model === 'string' ? body.model : (adapter.modelFor?.(ctx) ?? null)

  const supabase = createServiceClient()

  // 5. The most this call could cost, known before it is sent. A per-token
  //    call with no price to estimate from is not sent at all.
  const estimate = billing === 'free' ? 0 : await estimateCallCost(catalogApi, body, model, ctx.path)
  if (estimate === null && catalogApi.pricing_model === 'per_token') {
    return Response.json(
      { error: 'pricing_unavailable', message: `No price is available for ${catalogApi.name} right now, so the call was not sent. Try again in a minute.` },
      { status: 503 }
    )
  }

  // 5b. Spend controls, before the wallet so a blocked project never touches the balance
  const decision = await evaluatePolicy(supabase, caller, slug, body, model, estimate)
  if (!decision.allowed) {
    await supabase.from('api_calls').insert({
      ...callBase(caller, catalogApi, catalogApi.base_url, body, model),
      response_status: 403,
      duration_ms: Date.now() - start,
      status: 'blocked',
      blocked_reason: decision.reason,
    })
    return blockedResponse(decision, baseHeaders)
  }

  // 6. Agency wallet: it has to cover what the call could cost, not just be non-empty
  const balance = await getWalletBalance(caller.agency_id)
  const isAsync = catalogApi.execution_mode === 'async'
  const needed = catalogApi.pricing_model === 'per_token' || isAsync
    ? Math.max(MIN_BUFFER_USD, estimate ?? 0)
    : (catalogApi.price_per_call ?? 0)
  if (balance < needed) return insufficientBalance(balance, needed > MIN_BUFFER_USD ? needed : undefined)

  const postCtx = {
    origin: appUrl(new URL(req.url).origin),
    before: { project_spent: decision.project_spent_usd, client_spent: decision.client_spent_usd },
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
  const headers = adapter.buildHeaders(catalogApi, req.headers)
  let outboundBody: BodyInit
  if (form) {
    delete headers['Content-Type']   // fetch sets the multipart boundary itself
    outboundBody = form
  } else {
    outboundBody = JSON.stringify(adapter.prepareBody ? adapter.prepareBody(body, ctx) : body)
  }
  const isStream = adapter.wantsStream?.(body, ctx) ?? false

  let upstream: Response
  try {
    upstream = await fetch(externalUrl, { method: 'POST', headers, body: outboundBody })
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

  const upstreamType = upstream.headers.get('content-type') ?? ''

  // 8a. Streaming: log a pending row now (so the client gets X-Call-ID),
  //     pass the bytes through, and settle cost when the stream ends.
  if (isStream && upstream.ok && upstream.body && upstreamType.includes('text/event-stream')) {
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

    const stream = teeSse(upstream.body, async (events, cut) => {
      const usage = adapter.usageFromSse?.(events, ctx) ?? adapter.usageFromRequest?.(ctx) ?? null
      const priced = await priceCall(catalogApi, billing, ctx, model ?? modelFromEvents(events), usage, {
        streamed: cut ? streamedText(events) : undefined,
      })
      await settleCall(supabase, caller, catalogApi, callId, {
        ...priced,
        duration_ms: Date.now() - start,
        response_status: upstream.status,
        balance,
      }, postCtx)
    }, start + STREAM_BUDGET_MS)

    const streamHeaders: Record<string, string> = {
      ...baseHeaders,
      'Content-Type': upstreamType,
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    }
    if (callId) streamHeaders['X-Call-ID'] = callId
    return new Response(stream, { status: upstream.status, headers: streamHeaders })
  }

  // 8b. Buffered response: JSON, or bytes (audio, subtitle transcripts) passed through
  const duration = Date.now() - start
  const isJson = upstreamType.includes('json')
  let data: Record<string, unknown> = {}
  let raw: ArrayBuffer | null = null
  if (isJson) data = await upstream.json().catch(() => ({})) as Record<string, unknown>
  else raw = await upstream.arrayBuffer()

  let priced: Priced = { cost: 0, providerCost: 0, usage: null, status: 'catalog', model }
  if (upstream.ok) {
    const usage = catalogApi.pricing_model === 'per_token'
      ? ((isJson ? adapter.usageFromJson?.(data, ctx) : null) ?? adapter.usageFromRequest?.(ctx) ?? null)
      : null
    priced = await priceCall(catalogApi, billing, ctx, model, usage, { data: isJson ? data : null, resultCount: adapter.resultCount })
  }

  const { data: row } = await supabase
    .from('api_calls')
    .insert({
      ...callBase(caller, catalogApi, externalUrl, body, priced.model ?? model),
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

  const respHeaders: Record<string, string> = {
    ...baseHeaders,
    ...budgetHeaders(priced.cost),
    'X-Cost-USD': priced.cost.toFixed(6),
    'X-Balance-Remaining': Math.max(0, balance - priced.cost).toFixed(6),
    'X-Pricing-Status': priced.status,
  }
  if (callId) respHeaders['X-Call-ID'] = callId
  if (priced.usage) {
    respHeaders['X-Tokens-Used'] = `${priced.usage.input_tokens + (priced.usage.cached_input_tokens ?? 0)}+${priced.usage.output_tokens}`
  }

  if (raw) return new Response(raw, { status: upstream.status, headers: { ...respHeaders, 'Content-Type': upstreamType || 'application/octet-stream' } })
  return Response.json(data, { status: upstream.status, headers: respHeaders })
}

// ------------------------------------------------------------
// helpers
// ------------------------------------------------------------

function unsupported(provider: string, method: string, path: string | undefined) {
  return Response.json(
    {
      error: 'unsupported_endpoint',
      message: `${method} /${path ?? ''} on ${provider} is not available through key.one. Supported endpoints: ${appUrl('https://getkeyone.com')}/docs`,
    },
    { status: 404 }
  )
}

// Multipart form fields arrive as strings; "true", "1.5" mean what they look like
function coerceField(v: string): unknown {
  if (v === 'true') return true
  if (v === 'false') return false
  if (v !== '' && !Number.isNaN(Number(v)) && /^-?\d+(\.\d+)?$/.test(v)) return Number(v)
  return v
}

// Perplexity presets pick the model server-side; the stream's final response says which
function modelFromEvents(events: Record<string, unknown>[]): string | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const resp = events[i].response as { model?: unknown } | undefined
    if (typeof resp?.model === 'string') return resp.model
    if (typeof events[i].model === 'string') return events[i].model as string
  }
  return null
}

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

// Does a usage record bill for anything at all? An all-zero one means the
// response came in a shape the adapter could not read.
function hasUsage(u: TokenUsage): boolean {
  if (u.reported_cost_usd !== undefined || u.tool_calls) return true
  return [
    u.input_tokens, u.output_tokens, u.cached_input_tokens, u.cache_write_tokens, u.cache_write_1h_tokens,
    u.image_input_tokens, u.image_output_tokens, u.audio_input_tokens, u.audio_output_tokens,
    u.characters, u.minutes, u.units,
  ].some(v => (v ?? 0) > 0)
}

// Price a successful call. Unknown models fall back to the provider's '*'
// row, and a response without usage is billed at the pre-call estimate, so
// nothing is ever free by accident; the status says how it was priced.
// `streamed` is the text produced so far when a stream was cut short.
async function priceCall(
  api: CatalogApi,
  billing: EndpointBilling,
  ctx: UsageContext,
  model: string | null,
  usage: TokenUsage | null,
  opts: { data?: Record<string, unknown> | null; resultCount?: (json: unknown) => number; streamed?: string } = {}
): Promise<Priced> {
  const { data = null, resultCount, streamed } = opts
  if (api.pricing_model === 'per_token') {
    const id = model ?? (typeof data?.model === 'string' ? data.model : null)
    if (billing === 'free') return { cost: 0, providerCost: 0, usage, status: 'free', model: id }
    const price = await resolveModelPrice(api.provider, id ?? '')
    if (!price) {
      // The call was only sent because a price existed; the table went away since
      console.error(`[billing] no price for ${api.provider} ${id}: call left unbilled`)
      return { cost: 0, providerCost: 0, usage, status: 'unknown', model: id }
    }
    let billed = usage
    let status: Priced['status'] = price.status
    // A stream cut short has reported its output count too early, if at all
    if (billed && streamed !== undefined && billed.reported_cost_usd === undefined) {
      billed = { ...billed, output_tokens: Math.max(billed.output_tokens, roughTokens(streamed)) }
    }
    if (!billed || !hasUsage(billed)) {
      billed = estimateUsage(price, ctx.body, ctx.path, streamed === undefined ? undefined : roughTokens(streamed))
      status = 'estimated'
      console.error(`[billing] no usage from ${api.provider} /${endpointOf(ctx.path)} (${id}): billed the estimate`)
    }
    // A provider-reported cost already includes its tool fees
    const pc = providerCost(price, billed) + (billed.reported_cost_usd === undefined ? await toolFees(api.provider, billed.tool_calls) : 0)
    return { cost: userPrice(pc), providerCost: pc, usage: billed, status, model: id }
  }
  if (api.pricing_model === 'per_result') {
    const n = data && resultCount ? resultCount(data) : 0
    const unit = api.price_per_result ?? 0
    return { cost: n * unit, providerCost: n * (api.cost_per_call ?? unit / 1.3), usage: null, status: 'catalog', model }
  }
  const cost = api.price_per_call ?? 0
  return { cost, providerCost: api.cost_per_call ?? cost, usage: null, status: 'catalog', model }
}

// Everything in usage beyond the three token columns, for the call log
function usageDetail(usage: TokenUsage | null): Record<string, unknown> | null {
  if (!usage) return null
  const { input_tokens: _i, output_tokens: _o, cached_input_tokens: _c, ...rest } = usage
  void _i; void _o; void _c
  const entries = Object.entries(rest).filter(([, v]) => v !== undefined && v !== 0)
  return entries.length ? Object.fromEntries(entries) : null
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
          usage_detail: usageDetail(s.usage),
          ...(s.model ? { model: s.model } : {}),
        })
        .eq('id', callId)
    }

    if (s.cost > 0) {
      const charged = await chargeWallet(supabase, caller.agency_id, s.cost, `${api.slug} · ${caller.client.name} / ${caller.project.name}`, callId)
      const newBalance = s.balance - charged
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
    // Numbers are limits (max_tokens), never credentials
    if (typeof sanitized[key] !== 'number' && sensitiveKeys.some(s => key.toLowerCase().includes(s))) sanitized[key] = '[redacted]'
  }
  // Base64 image payloads have no business in the log
  for (const key of ['image', 'mask', 'b64_json', 'file']) {
    if (typeof sanitized[key] === 'string' && (sanitized[key] as string).length > 200) sanitized[key] = '[omitted]'
  }
  return sanitized
}
