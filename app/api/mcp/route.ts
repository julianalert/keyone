import { NextRequest, NextResponse } from 'next/server'
import { getSessionContext } from '@/lib/agency'

// Never prerender: this reads live data at request time
export const dynamic = 'force-dynamic'

export const runtime = 'nodejs'
// Long generations (Opus, Fable, big prompts) need the full function budget on Vercel
export const maxDuration = 300

// key.one MCP server. Stateless Streamable HTTP: every call is one JSON-RPC
// POST, authenticated with an agency key. Connect from Claude Code with:
//   claude mcp add --transport http keyone https://<host>/api/mcp \
//     --header "Authorization: Bearer kone_admin_…"

const PROTOCOL_VERSION = '2025-06-18'

interface JsonRpcRequest { jsonrpc: '2.0'; id?: string | number | null; method: string; params?: Record<string, unknown> }

const TOOLS = [
  {
    name: 'keyone_whoami',
    description: 'The agency this key belongs to, its wallet balance, and how many clients and projects it has.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'keyone_list_clients',
    description: 'List clients (cost centers) with project counts and month-to-date spend.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'keyone_create_client',
    description: 'Create a client. Optional monthly budget in USD and rebill markup percent.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        monthly_budget_usd: { type: 'number' },
        rebill_markup_pct: { type: 'number' },
      },
      required: ['name'],
      additionalProperties: false,
    },
  },
  {
    name: 'keyone_list_projects',
    description: 'List projects under a client, with month-to-date spend and the active key prefix.',
    inputSchema: { type: 'object', properties: { client_id: { type: 'string' } }, required: ['client_id'], additionalProperties: false },
  },
  {
    name: 'keyone_create_project',
    description:
      'Create a project under a client and mint its key. Returns the plaintext key ONCE; give it to the user immediately. ' +
      'Pass client_id, or client_name to find or create the client by name.',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        client_name: { type: 'string' },
        name: { type: 'string' },
        monthly_budget_usd: { type: 'number' },
        max_cost_per_call_usd: { type: 'number' },
        allowed_apis: { type: 'array', items: { type: 'string' }, description: 'Catalog slugs, e.g. ["openai","anthropic"]. Omit for all.' },
        allowed_models: { type: 'array', items: { type: 'string' }, description: 'Model ids or prefixes. Omit for any.' },
      },
      required: ['name'],
      additionalProperties: false,
    },
  },
  {
    name: 'keyone_update_project',
    description: 'Change a project budget, per-call cap, allowed tools, or active flag.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string' },
        name: { type: 'string' },
        monthly_budget_usd: { type: ['number', 'null'] },
        max_cost_per_call_usd: { type: ['number', 'null'] },
        allowed_apis: { type: 'array', items: { type: 'string' } },
        allowed_models: { type: 'array', items: { type: 'string' } },
        is_active: { type: 'boolean' },
      },
      required: ['project_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'keyone_rotate_project_key',
    description: 'Issue a new key for a project and revoke the others. Returns the new plaintext key ONCE.',
    inputSchema: { type: 'object', properties: { project_id: { type: 'string' } }, required: ['project_id'], additionalProperties: false },
  },
  {
    name: 'keyone_get_spend',
    description: 'Month-to-date spend. With project_id: the project, its budgets, blocked calls, recent calls. With client_id: spend by project and by tool plus the rebill amount. With neither: the agency overview.',
    inputSchema: {
      type: 'object',
      properties: { project_id: { type: 'string' }, client_id: { type: 'string' } },
      additionalProperties: false,
    },
  },
  {
    name: 'keyone_request_budget',
    description: 'File a budget-increase request for a project. Auto-approved when within the agency limit; otherwise the owner gets an approve link. Returns the request with its status.',
    inputSchema: {
      type: 'object',
      properties: { project_id: { type: 'string' }, requested_budget_usd: { type: 'number' }, reason: { type: 'string' } },
      required: ['project_id', 'requested_budget_usd'],
      additionalProperties: false,
    },
  },
  {
    name: 'keyone_list_requests',
    description: 'List budget requests across the agency, optionally filtered by status (pending, approved, denied).',
    inputSchema: { type: 'object', properties: { status: { type: 'string' } }, additionalProperties: false },
  },
  {
    name: 'keyone_decide_request',
    description: 'Approve or deny a pending budget request. Approval applies the new budget immediately. Only do this when the user explicitly asks.',
    inputSchema: {
      type: 'object',
      properties: { request_id: { type: 'string' }, action: { type: 'string', enum: ['approve', 'deny'] } },
      required: ['request_id', 'action'],
      additionalProperties: false,
    },
  },
  {
    name: 'keyone_unfreeze_key',
    description: 'Unfreeze a project key that the spend-spike control froze. Only after the user has checked what the key was doing.',
    inputSchema: { type: 'object', properties: { project_id: { type: 'string' }, key_id: { type: 'string' } }, required: ['project_id', 'key_id'], additionalProperties: false },
  },
  {
    name: 'keyone_list_alerts',
    description: 'Recent alerts: budget thresholds crossed, keys frozen, budget requests and decisions.',
    inputSchema: { type: 'object', properties: { unread_only: { type: 'boolean' }, limit: { type: 'number' } }, additionalProperties: false },
  },
  {
    name: 'keyone_report',
    description: 'Spend report for a date range. With client_id: totals, by project, by tool, by model, with provider cost, price, and rebill at the client markup. Without: every client side by side. range is this_month (default) or last_month, or pass from/to as YYYY-MM-DD.',
    inputSchema: {
      type: 'object',
      properties: { client_id: { type: 'string' }, range: { type: 'string', enum: ['this_month', 'last_month'] }, from: { type: 'string' }, to: { type: 'string' } },
      additionalProperties: false,
    },
  },
  {
    name: 'keyone_controller_run',
    description: 'Run the spend controller now: it reviews the last 35 days across clients and projects, writes a digest, and proposes changes. Returns the digest and new findings. Nothing is applied.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'keyone_controller_findings',
    description: 'Latest controller digest and findings, optionally filtered by status (proposed, applied, dismissed). Each finding has a proposal you can apply with keyone_apply_finding.',
    inputSchema: { type: 'object', properties: { status: { type: 'string', enum: ['proposed', 'applied', 'dismissed'] } }, additionalProperties: false },
  },
  {
    name: 'keyone_apply_finding',
    description: 'Apply or dismiss a controller proposal. Only when the user explicitly asks. Apply performs the proposed change (budget, cap, allowed models, markup, or request approval).',
    inputSchema: {
      type: 'object',
      properties: { finding_id: { type: 'string' }, action: { type: 'string', enum: ['apply', 'dismiss'] } },
      required: ['finding_id', 'action'],
      additionalProperties: false,
    },
  },
  {
    name: 'keyone_list_models',
    description: 'Every model the proxy can price, with the price per 1M tokens the project will be charged.',
    inputSchema: { type: 'object', properties: { provider: { type: 'string' } }, additionalProperties: false },
  },
]

export async function POST(req: NextRequest) {
  const ctx = await getSessionContext(req)
  if (!ctx || ctx.via !== 'agency_key') {
    return NextResponse.json(
      { jsonrpc: '2.0', id: null, error: { code: -32001, message: 'Unauthorized: send Authorization: Bearer kone_admin_… (an agency key from Settings)' } },
      { status: 401 }
    )
  }

  let payload: JsonRpcRequest | JsonRpcRequest[]
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, { status: 400 })
  }

  const origin = new URL(req.url).origin   // internal calls go back to this same deployment
  const auth = req.headers.get('authorization') ?? ''
  const api = (path: string, init?: RequestInit) =>
    fetch(`${origin}${path}`, { ...init, headers: { 'Content-Type': 'application/json', Authorization: auth, ...(init?.headers ?? {}) } })
      .then(async r => ({ ok: r.ok, status: r.status, json: await r.json().catch(() => ({})) }))

  const handle = async (msg: JsonRpcRequest): Promise<Record<string, unknown> | null> => {
    const id = msg.id ?? null
    const reply = (result: unknown) => ({ jsonrpc: '2.0', id, result })
    const fail = (code: number, message: string) => ({ jsonrpc: '2.0', id, error: { code, message } })

    switch (msg.method) {
      case 'initialize':
        return reply({
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: 'keyone', version: '0.8.0' },
          instructions:
            'key.one is spend management for AI agents. Clients are cost centers, projects sit under clients, and each project has one key that works for every tool in the catalog. ' +
            'Create a project to get a key; give the plaintext key to the user once. Use keyone_get_spend before raising budgets.',
        })
      case 'notifications/initialized':
      case 'notifications/cancelled':
        return null
      case 'ping':
        return reply({})
      case 'tools/list':
        return reply({ tools: TOOLS })
      case 'tools/call': {
        const name = String(msg.params?.name ?? '')
        const args = (msg.params?.arguments ?? {}) as Record<string, unknown>
        try {
          const result = await callTool(name, args, api)
          return reply({ content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] })
        } catch (err) {
          return reply({ content: [{ type: 'text', text: String(err instanceof Error ? err.message : err) }], isError: true })
        }
      }
      default:
        return fail(-32601, `Method not found: ${msg.method}`)
    }
  }

  if (Array.isArray(payload)) {
    const out = (await Promise.all(payload.map(handle))).filter(Boolean)
    return out.length ? NextResponse.json(out) : new Response(null, { status: 202 })
  }
  const out = await handle(payload)
  return out ? NextResponse.json(out) : new Response(null, { status: 202 })
}

// No server-initiated stream in stateless mode
export async function GET() {
  return NextResponse.json({ error: 'Use POST. This MCP server is stateless Streamable HTTP.' }, { status: 405 })
}

export async function DELETE() {
  return new Response(null, { status: 200 })
}

type Api = (path: string, init?: RequestInit) => Promise<{ ok: boolean; status: number; json: Record<string, unknown> }>

async function callTool(name: string, a: Record<string, unknown>, api: Api): Promise<unknown> {
  const need = (r: { ok: boolean; status: number; json: Record<string, unknown> }) => {
    if (!r.ok) throw new Error(`${r.status}: ${String(r.json.error ?? 'request failed')}`)
    return r.json
  }

  switch (name) {
    case 'keyone_whoami': {
      const [agency, clients] = await Promise.all([api('/api/agency'), api('/api/clients')])
      const list = (need(clients) as unknown as Array<{ project_count: number }>)
      return { ...need(agency), clients: list.length, projects: list.reduce((s, c) => s + c.project_count, 0) }
    }
    case 'keyone_list_clients':
      return need(await api('/api/clients'))
    case 'keyone_create_client':
      return need(await api('/api/clients', { method: 'POST', body: JSON.stringify(a) }))
    case 'keyone_list_projects':
      return need(await api(`/api/clients/${a.client_id}/projects`))
    case 'keyone_create_project': {
      let clientId = a.client_id as string | undefined
      if (!clientId && typeof a.client_name === 'string') {
        const clients = need(await api('/api/clients')) as unknown as Array<{ id: string; name: string }>
        const found = clients.find(c => c.name.toLowerCase() === (a.client_name as string).toLowerCase())
        clientId = found?.id ?? (need(await api('/api/clients', { method: 'POST', body: JSON.stringify({ name: a.client_name }) })) as { id: string }).id
      }
      if (!clientId) throw new Error('client_id or client_name is required')
      const created = need(await api(`/api/clients/${clientId}/projects`, {
        method: 'POST',
        body: JSON.stringify({ name: a.name, monthly_budget_usd: a.monthly_budget_usd ?? null }),
      })) as { id: string; api_key: string }
      if (a.max_cost_per_call_usd !== undefined || a.allowed_apis !== undefined || a.allowed_models !== undefined) {
        await api(`/api/projects/${created.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ max_cost_per_call_usd: a.max_cost_per_call_usd ?? null, allowed_apis: a.allowed_apis ?? null, allowed_models: a.allowed_models ?? null }),
        })
      }
      return {
        ...created,
        how_to_use: {
          openai_sdk: 'base_url = "<keyone origin>/api/proxy/openai/v1", api_key = the key above',
          anthropic_sdk: 'base_url = "<keyone origin>/api/proxy/anthropic", api_key = the key above',
          note: 'Show the key to the user now. It is not stored and cannot be retrieved later.',
        },
      }
    }
    case 'keyone_update_project': {
      const { project_id, ...rest } = a
      return need(await api(`/api/projects/${project_id}`, { method: 'PATCH', body: JSON.stringify(rest) }))
    }
    case 'keyone_rotate_project_key':
      return need(await api(`/api/projects/${a.project_id}/keys`, { method: 'POST', body: JSON.stringify({ revoke_others: true }) }))
    case 'keyone_get_spend': {
      if (a.project_id) {
        const [p, an] = await Promise.all([api(`/api/projects/${a.project_id}`), api(`/api/analytics/projects/${a.project_id}`)])
        const proj = need(p) as Record<string, unknown>
        const calls = (need(an).recent_calls as unknown[]) ?? []
        return { ...proj, recent_calls: calls.slice(0, 10) }
      }
      if (a.client_id) return need(await api(`/api/analytics/clients/${a.client_id}`))
      return need(await api('/api/analytics/overview'))
    }
    case 'keyone_request_budget': {
      const { project_id, ...rest } = a
      return need(await api(`/api/projects/${project_id}/requests`, { method: 'POST', body: JSON.stringify(rest) }))
    }
    case 'keyone_list_requests':
      return need(await api(`/api/requests${a.status ? `?status=${a.status}` : ''}`))
    case 'keyone_decide_request':
      return need(await api(`/api/requests/${a.request_id}`, { method: 'PATCH', body: JSON.stringify({ action: a.action }) }))
    case 'keyone_unfreeze_key':
      return need(await api(`/api/projects/${a.project_id}/keys/${a.key_id}`, { method: 'PATCH', body: JSON.stringify({ frozen: false }) }))
    case 'keyone_list_alerts':
      return need(await api(`/api/alerts?limit=${Number(a.limit ?? 20)}${a.unread_only ? '&unread=1' : ''}`))
    case 'keyone_report': {
      const qs = new URLSearchParams()
      if (a.range) qs.set('range', String(a.range))
      if (a.from) qs.set('from', String(a.from))
      if (a.to) qs.set('to', String(a.to))
      const q = qs.toString() ? `?${qs}` : ''
      return need(await api(a.client_id ? `/api/reports/clients/${a.client_id}${q}` : `/api/reports/agency${q}`))
    }
    case 'keyone_controller_run':
      return need(await api('/api/controller/run', { method: 'POST', body: '{}' }))
    case 'keyone_controller_findings':
      return need(await api(`/api/controller/runs${a.status ? `?status=${a.status}` : ''}`))
    case 'keyone_apply_finding':
      return need(await api(`/api/controller/findings/${a.finding_id}`, { method: 'PATCH', body: JSON.stringify({ action: a.action }) }))
    case 'keyone_list_models': {
      const d = need(await api('/api/pricing')) as { models: Array<{ provider: string }> }
      return a.provider ? { ...d, models: d.models.filter(m => m.provider === a.provider) } : d
    }
    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}
