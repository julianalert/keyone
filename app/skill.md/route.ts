import { appUrl } from '@/lib/config'

export const runtime = 'nodejs'

// GET /skill.md — install into any agent with: set up https://<host>/skill.md
export async function GET(req: Request) {
  const origin = appUrl(new URL(req.url).origin)
  const body = `---
name: keyone
version: 0.9.1
description: >-
  key.one is spend management for AI agents. One key per client project
  works for every AI model and tool in the catalog, with budgets enforced
  before each call. Use this skill whenever the user mentions key.one, wants
  a project key, wants to set up OpenAI or Anthropic access for a client
  project, asks what a project or client has spent, or hits a BLOCKED
  response from the key.one proxy.
---

# key.one

Agencies run many client projects, each calling OpenAI, Anthropic, and other
tools. key.one replaces per-provider API keys with one **project key** per
client project. The key spends from the agency wallet, is limited by the
project's budget, and every call is attributed to client → project → tool → model.

Two kinds of key:

| Key | Prefix | Can |
|-----|--------|-----|
| Project key | \`kone_live_\` | Call any tool through the proxy. Check its own budget. |
| Agency key | \`kone_admin_\` | Manage: create clients and projects, mint project keys, read spend. |

## Calling models with a project key

By convention the project key and base URLs live in the app's env file as
\`KEYONE_API_KEY\`, \`KEYONE_OPENAI_BASE_URL\` and \`KEYONE_ANTHROPIC_BASE_URL\`.
Point the SDK at key.one and use the project key as the API key. Nothing else changes.

\`\`\`python
# OpenAI SDK
client = OpenAI(base_url="${origin}/api/proxy/openai/v1", api_key="kone_live_…")

# Anthropic SDK
client = Anthropic(base_url="${origin}/api/proxy/anthropic", api_key="kone_live_…")
\`\`\`

\`\`\`bash
curl -X POST ${origin}/api/proxy/openai \\
  -H "Authorization: Bearer kone_live_…" -H "Content-Type: application/json" \\
  -d '{"model":"gpt-5-mini","messages":[{"role":"user","content":"Hello"}]}'
\`\`\`

\`model\` may be \`cheapest\`, \`balanced\`, or \`best\`; key.one resolves it per provider from its
price table and returns the choice in \`X-Model-Resolved\`. Prefer \`cheapest\` unless the task
needs more.

Streaming (\`stream: true\`) works as with the provider. Every response carries
\`X-Cost-USD\`, \`X-Call-ID\`, and, when budgets are set, \`X-Project-Budget-Remaining\`
and \`X-Client-Budget-Remaining\`.

### Check budget before big jobs

\`\`\`bash
curl ${origin}/api/proxy/status -H "Authorization: Bearer kone_live_…"
\`\`\`

Returns month-to-date spend, monthly budget, remaining, per-call cap, allowed
tools, wallet balance, and when budgets reset.

### When a call is BLOCKED

A **403** with \`"status": "BLOCKED"\` means a spend control refused the call
before it reached the provider. The body has \`reason\`, a plain \`message\`, and
\`controls\` describing which limit tripped, what was spent, what remains, and
\`resets_at\`. Do not retry as-is. Tell the user which control blocked it and
that they can raise it in the key.one dashboard or via an agency key. Reasons:
\`project_monthly_budget\`, \`client_monthly_budget\`, \`project_call_cap\`
(lower \`max_tokens\` or pick a cheaper model), \`project_allowed_apis\`,
\`project_allowed_models\` (use one of the listed models).

\`key_frozen\` means the spend-spike control froze this key; only the agency can unfreeze it.

### Asking for more budget

When blocked by \`project_monthly_budget\` or \`client_monthly_budget\`, you may file a
request instead of giving up. Say why, and ask for a specific monthly amount:

\`\`\`bash
curl -X POST ${origin}/api/proxy/requests \\
  -H "Authorization: Bearer kone_live_…" -H "Content-Type: application/json" \\
  -d '{"requested_budget_usd": 75, "reason": "Monthly newsletter run needs ~$60; current cap is $50"}'
\`\`\`

Small increases may be approved automatically (the response says \`"status": "approved"\`).
Otherwise the owner gets an email with approve/deny links; poll \`GET /api/proxy/requests\`
or tell the user to expect a decision. File one request per block, not one per retry.

A **402** means the agency wallet is empty. Only the agency owner can top up.

## Managing projects with an agency key

Get an agency key from the key.one dashboard → Settings. Then either connect
the MCP server:

\`\`\`bash
claude mcp add --transport http keyone ${origin}/api/mcp \\
  --header "Authorization: Bearer kone_admin_…"
\`\`\`

Tools: \`keyone_whoami\`, \`keyone_list_clients\`, \`keyone_create_client\`,
\`keyone_list_projects\`, \`keyone_create_project\`, \`keyone_update_project\`,
\`keyone_rotate_project_key\`, \`keyone_get_spend\`, \`keyone_list_models\`,
\`keyone_request_budget\`, \`keyone_list_requests\`, \`keyone_decide_request\`,
\`keyone_unfreeze_key\`, \`keyone_list_alerts\`, \`keyone_report\` (date-ranged spend and rebill,
per client or agency-wide), \`keyone_controller_run\`, \`keyone_controller_findings\`,
\`keyone_apply_finding\` (the spend controller: it reviews everything, proposes changes, and
applies one only when the user says so).

Or call the REST API with the same header:

| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/agency | Agency and wallet |
| GET / POST | /api/clients | List or create clients |
| GET / POST | /api/clients/:id/projects | List projects, or create one (returns its key once) |
| GET / PATCH | /api/projects/:id | Project detail, budgets, allowed tools |
| POST | /api/projects/:id/keys | Mint a key; \`{"revoke_others": true}\` rotates |
| GET | /api/analytics/overview | Agency-wide spend |
| GET | /api/analytics/clients/:id | Month-to-date spend by project and tool |
| GET | /api/reports/clients/:id?range=last_month | Report: totals, by project/tool/model, rebill |
| GET | /api/reports/clients/:id/export?range=… | CSV line items for invoicing |
| GET | /api/reports/agency?range=… | All clients side by side |
| GET | /api/pricing | Models and prices per 1M tokens |

## Rules for agents

1. **A project key is shown once.** When you create a project or rotate a key, give the plaintext key to the user immediately and never log it elsewhere.
2. **Never spend from a project that isn't the user's.** Use the client and project the user names; ask if unclear.
3. **Check \`/api/proxy/status\` before large or batch jobs** and report remaining budget when the user cares about cost.
4. **Treat BLOCKED as final.** Explain the control and offer the fix; do not loop on retries.
5. **Prefer the cheapest model that does the job.** \`keyone_list_models\` shows prices. Set \`max_tokens\` to keep the per-call estimate honest.
6. **Do not create agency keys.** They can only be made in the dashboard.
7. **Approve, deny, or unfreeze only when the user explicitly says so.** Reading requests and alerts is always fine.
`
  return new Response(body, { headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'public, max-age=300' } })
}
