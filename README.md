# key.one — Spend management for AI agents

> One key per client project. Every tool in the catalog. Spend controlled and attributed per client.

Built for agencies: an **agency** has **clients** (cost centers), each client has **projects**, and each project has a **key**. The key works for every provider in the catalog, so adding a tool never means a new key. Every call is logged against agency, client, project, and key.

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Supabase** — Auth, Postgres, RLS
- **Stripe** — Wallet top-ups, webhooks
- **Upstash Redis** — Per-key rate limiting (100 req/min)
- **Inngest** — Background jobs (budget alerts, email receipts)
- **Resend** — Transactional email
- **Recharts** — Spend timeline charts

## Setup

### 1. Environment variables

```bash
cp .env.example .env.local
# Fill in all values — see .env.example for descriptions
```

### 2. Supabase schema

Run the migrations in order in your Supabase project's SQL Editor:

```
001_initial.sql               → catalog + base tables
002_async_support.sql         → async runs (Apify)
003_agencies_clients_projects → agencies, clients, projects, project keys
004_spend_controls            → per-call cap, allowed tools, blocked-call logging
005_pricing_and_providers     → model_prices table (seeded), provider cost on every call
006_agency_keys               → management keys for agents (MCP, skill, scripts)
007_alerts_and_approvals      → alerts, spike auto-freeze, budget requests
008_reports                   → SQL aggregates for date-ranged reports
009_controller                → controller runs and findings, allowed models per project
010_welcome_credit            → $3 wallet credit on signup
011_stripe_idempotency        → one credit per payment intent
012_refunds                   → refunds debit the wallet
013_onboarding_and_team       → onboarding state, team policies, invite-aware signup
```

Migration 003 drops the agent-scoped tables and recreates them. On signup a trigger creates the user's agency, membership, and wallet, credited with $3 (migration 010).

### 3. Stripe

Wallet top-ups use a Payment Intent and Stripe's Payment Element (cards, wallets, bank redirects, whatever the account enables). Minimum $5, maximum $5,000.

Create a webhook endpoint in Stripe → Developers → Webhooks pointing at:
```
https://your-domain.com/api/webhooks/stripe
```
with events `payment_intent.succeeded`, `payment_intent.payment_failed`, and `charge.refunded`, and put its signing secret in `STRIPE_WEBHOOK_SECRET`. A refund in Stripe debits the wallet by the refunded amount (migration 012).

To verify live payments cheaply: set `TOP_UP_MIN_USD=1`, top up $1 with a real card, confirm the credit and the webhook delivery in Stripe's dashboard, then refund it there; the wallet goes back down and you're out only Stripe's fixed fee.

Credits are idempotent: the wallet page confirms the payment server-side the moment the card clears, and the webhook confirms it again; the same payment intent can only credit once (migration 011). A receipt goes out through the alerts path (email + webhook). Locally, run `stripe listen --forward-to localhost:3001/api/webhooks/stripe` and use the printed `whsec_` secret.

### 4. Inngest

Deploy to Vercel and register the Inngest endpoint at:
```
https://your-domain.com/api/inngest
```

### 5. Dev server

```bash
npm install
npm run dev
```

## Architecture

```
Agency ─┬─ Client A ─┬─ Project "Blog writer"  ── key kone_live_…
        │            └─ Project "Ad copy"      ── key kone_live_…
        └─ Client B ─── Project "SEO audit"    ── key kone_live_…

Agent / script
     │
     │  Authorization: Bearer kone_live_xxxx      (the project key, nothing else)
     ▼
POST /api/proxy/{slug}
     │
     ├── Resolve key → project → client → agency (one indexed SHA-256 lookup)
     ├── Rate limit per key (Upstash, 100/min)
     ├── Spend controls → 403 BLOCKED if any trips
     │   ├── allowed tools for the project
     │   ├── project monthly budget (month-to-date + this call's price)
     │   ├── client monthly budget
     │   └── per-call cap (per-token calls estimated from prompt size + max_tokens)
     ├── Check agency wallet balance
     ├── Provider adapter builds the upstream request (lib/providers/*)
     ├── Streaming (stream: true) is passed through as-is; usage is read from
     │   the SSE tail and the call is settled when the stream ends
     ├── Price from model_prices (exact → alias → prefix → provider fallback) × margin
     ├── Log api_calls row stamped with agency, client, project, key
     ├── Atomic wallet deduction (Postgres SELECT FOR UPDATE)
     └── Return response + X-Cost-USD, X-Balance-Remaining, X-Project-ID, X-Client-ID
```

Keys are SHA-256 hashed at rest. A project can hold several keys (rotation); revoking one never touches the project's history or budget.

## V1 Catalog

| API | Slug | Pricing |
|-----|------|---------|
| OpenAI (GPT-4o, GPT-4o-mini) | `openai` | per token |
| Anthropic (Claude Sonnet, Haiku) | `anthropic` | per token |
| Perplexity (Sonar, Sonar Pro) | `perplexity` | per call |
| Google Maps via Apify | `apify-google-maps` | per result |
| DataForSEO | `dataforseo` | per result |

## Calling the proxy

```bash
curl -X POST https://your-domain.com/api/proxy/openai \
  -H "Authorization: Bearer kone_live_xxxx" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "Hello"}]}'
```

Response headers include:
- `X-Cost-USD` — cost charged for this call
- `X-Balance-Remaining` — wallet balance after deduction
- `X-Call-ID` — log entry UUID
- `X-Project-ID`, `X-Client-ID` — where the spend was attributed
- `X-Tokens-Used` — `{input}+{output}` for LLM calls

## Onboarding

A new agency lands on a four-step first run instead of an empty overview: create a client, create a project (the key is minted), copy a connect snippet with the key and domain filled in, send a test call and see the cost land on the client. A "Getting started" checklist stays on the overview until the four milestones (project, first call, budget, agent connected) are met, derived from data, dismissable. A welcome email goes out through Resend on the first dashboard visit. Confirmation and invite links pass through `/auth/callback`, which exchanges the code for a session server-side.

## Team

Settings → Team invites colleagues by email. Existing key.one users are added immediately; new ones get a Supabase invite that lands on `/set-password`, and the signup trigger attaches them to the inviting agency instead of creating a new one. Roles: owner (fixed), admin (can invite and remove), member. Everyone on the team sees every client and project.

## Model shortcuts

A request may use `cheapest`, `balanced`, or `best` as the model. The proxy resolves it per provider from the price table (lowest, median, or highest output price among current models) and reports the choice in `X-Model-Resolved`. Allowed-model rules apply to the resolved id.

## Agents: skill, MCP, and SDK base URLs

Two kinds of key. A **project key** (`kone_live_`) spends. An **agency key** (`kone_admin_`, minted in Settings) manages: it can create clients and projects, mint project keys, and read spend, but cannot spend or mint more agency keys.

- **Skill**: paste `set up https://your-domain.com/skill.md` into Claude Code, Cursor, or any agent that reads skills. The file is served by the app and explains keys, the proxy, BLOCKED handling, and the management API.
- **MCP**: `claude mcp add --transport http keyone https://your-domain.com/api/mcp --header "Authorization: Bearer kone_admin_…"`. Stateless Streamable HTTP; tools: `keyone_whoami`, `keyone_list_clients`, `keyone_create_client`, `keyone_list_projects`, `keyone_create_project`, `keyone_update_project`, `keyone_rotate_project_key`, `keyone_get_spend`, `keyone_list_models`.
- **SDKs**: `OpenAI(base_url=".../api/proxy/openai/v1", api_key="kone_live_…")` and `Anthropic(base_url=".../api/proxy/anthropic", api_key="kone_live_…")`. The proxy accepts the key in `Authorization: Bearer` or `x-api-key`, appends the SDK's own path to the provider origin, and passes `anthropic-version`, `anthropic-beta`, and `openai-beta` through.
- Every management endpoint accepts the agency key in `Authorization: Bearer` as an alternative to the dashboard session.

## Alerts, auto-freeze, and budget requests

- **Threshold alerts** fire once per month when a project or client crosses 50, 80, or 100% of its budget. Stored in `alerts`, delivered by email (Resend) and to the agency's webhook URL when set.
- **Spike auto-freeze** runs after every settled call: if a key spent more than `spike_floor_usd` in the last hour and more than `spike_multiplier` × its hourly average over the previous week, that key is frozen. Frozen keys get `403 BLOCKED` with `reason: "key_frozen"`. Unfreeze from the project page, `PATCH /api/projects/:id/keys/:keyId {"frozen": false}`, or the `keyone_unfreeze_key` MCP tool. Defaults: 10× and $10; both are per-agency settings.
- **Budget requests**: an agent files `POST /api/proxy/requests {"requested_budget_usd", "reason"}` with its project key. Increases within `auto_approve_increase_usd` (default 0, i.e. never) are applied instantly; otherwise the owner gets an email with single-use approve/deny links (`/api/requests/:id/decide?token=…&action=…`), and the request can also be decided from the project page or via MCP.

## Controller agent

The controller is the FinOps review an agency wouldn't staff. `POST /api/controller/run` (or the daily cron at `/api/controller/cron`, protected by `CRON_SECRET`, scheduled in `vercel.json`) loads 35 days of facts in one SQL call and runs deterministic checks: burn rate vs budget, weekly drift, premium models used for short outputs, idle budgets, repeated blocks, failure rates, fallback-priced models, zero-markup clients, and stale budget requests. Each finding carries exact numbers and, where there is a fix, a proposal (set a budget, cap, allowed models, markup, or approve a request). Claude Sonnet 5 writes the digest from those findings when `ANTHROPIC_API_KEY` is set; otherwise a plain deterministic digest goes out. The run's own model cost is recorded on the run and paid by key.one, not the agency. Nothing is applied until someone clicks Apply on the Controller page or calls `keyone_apply_finding`. `controller_autonomy` on the agency is reserved for a future auto-apply mode.

Projects also gained `allowed_models` (ids or prefixes); the proxy blocks other models with `reason: "project_allowed_models"`.

## Reports and rebill

`GET /api/reports/clients/:id` and `GET /api/reports/agency` take `range=this_month|last_month` or `from=YYYY-MM-DD&to=YYYY-MM-DD` and return totals plus breakdowns (client: by project, tool, model, day; agency: by client and project). Each bucket carries `provider_cost_usd` (what key.one paid), `price_usd` (what the project was charged), and `rebill_usd` (price × the client's markup). Append `/export` for CSV: the client export is one row per call for invoicing, the agency export one row per client × project. Aggregation runs in SQL (`report_*` functions), so reports are one round trip regardless of volume.

## Providers and pricing

Each upstream provider is one adapter in `lib/providers/` (URL, headers, body tweaks, token or result accounting). Adding a tool means one catalog row and, if it bills per token, rows in `model_prices`. No proxy code changes.

Prices live in the `model_prices` table as wholesale per-1M-token rates and are cached for a minute. The user price is wholesale × (1 + `KEYONE_MARGIN_PCT` / 100), default 30%. Model lookup is exact id, then the id without a date suffix, then the longest known prefix, then the provider's `*` row. An unknown model is therefore charged at the provider's top tier rather than for free, and the call is tagged `pricing_status = 'fallback'` so it stands out. `GET /api/pricing` lists user prices. Long-context surcharges are not modeled yet.

Streaming works for OpenAI, Anthropic, and Perplexity: send `stream: true` exactly as you would to the provider. The response carries `X-Call-ID` up front; cost is settled and deducted after the last event.

## Spend controls

Every project can carry a monthly budget, a per-call cap, and an allowed-tools list. Every client can carry a monthly budget. The proxy evaluates them before the upstream call and refuses with **403** and a stable body, so SDKs don't retry and agents can explain the block:

```json
{
  "status": "BLOCKED",
  "reason": "project_monthly_budget",
  "message": "Project \"Blog writer\" has spent $50.0000 of its $50.00 monthly budget.",
  "controls": [{
    "type": "PROJECT_MONTHLY_BUDGET",
    "scope": { "project_id": "…", "project_name": "Blog writer", "client_id": "…", "client_name": "Acme" },
    "limit_usd": 50, "spent_usd": 50.0, "remaining_usd": 0,
    "resets_at": "2026-10-01T00:00:00.000Z"
  }],
  "hint": "Ask the agency to raise the limit in the key.one dashboard, or wait for resets_at."
}
```

Control types: `PROJECT_MONTHLY_BUDGET`, `CLIENT_MONTHLY_BUDGET`, `PROJECT_CALL_CAP`, `PROJECT_ALLOWED_APIS`. Blocked calls are logged with `status = 'blocked'` and count toward reporting but never toward spend.

Successful responses add `X-Project-Budget-Remaining` and `X-Client-Budget-Remaining` when a budget is set.

An agent can check its own limits with nothing but its key:

```bash
curl https://your-domain.com/api/proxy/status -H "Authorization: Bearer kone_live_xxxx"
```

## Dashboard API

| Endpoint | Purpose |
|----------|---------|
| `GET/POST /api/clients` | List or create clients |
| `GET/PATCH/DELETE /api/clients/:id` | Client detail, edit, deactivate |
| `GET/POST /api/clients/:id/projects` | List projects, or create one (returns its key once) |
| `GET/PATCH/DELETE /api/projects/:id` | Project detail with keys and stats |
| `GET/POST /api/projects/:id/keys` | List keys, issue a new one (`revoke_others: true` rotates) |
| `DELETE /api/projects/:id/keys/:keyId` | Revoke a key |
| `GET /api/analytics/overview` | Agency-wide numbers |
| `GET /api/analytics/clients/:id` | Spend by project and API, plus rebill amount |
| `GET /api/analytics/projects/:id` | Recent calls and spend by API |
| `GET /api/analytics/timeline?client_id=&project_id=&days=` | Daily spend series |
