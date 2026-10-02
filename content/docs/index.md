---
title: "Developer docs"
description: "Connect a client project to keyone: base URLs, project keys, response headers, blocked calls, budget requests, the MCP server and the REST API."
updated: 2026-10-02
---
keyone sits between your code and the providers. You point your SDK at keyone, use a project key as the API key, and every call is attributed to its client and project and checked against its limits.

**To connect a project, change two things in your OpenAI or Anthropic SDK: the base URL and the API key. Streaming, tools and provider headers pass through unchanged.**

## Quickstart

Create a client and a project in the dashboard, copy the project key, then point your SDK at keyone.

```python
from openai import OpenAI
from anthropic import Anthropic

# OpenAI SDK
client = OpenAI(
    base_url="{{ORIGIN}}/api/proxy/openai/v1",
    api_key="kone_live_…",
)

# Anthropic SDK, same key
claude = Anthropic(
    base_url="{{ORIGIN}}/api/proxy/anthropic",
    api_key="kone_live_…",
)
```

Or let the installer do it. Run this in the project root: it asks for the key with a hidden prompt, writes it to your git-ignored env file, rewires the OpenAI, Anthropic, Vercel AI SDK and LangChain clients it recognises, and makes one test call.

```bash
npx keyone-cli setup --apply
```

By convention the key and base URLs live in your env file:

```bash
KEYONE_API_KEY=kone_live_…
KEYONE_OPENAI_BASE_URL={{ORIGIN}}/api/proxy/openai/v1
KEYONE_ANTHROPIC_BASE_URL={{ORIGIN}}/api/proxy/anthropic
KEYONE_PERPLEXITY_BASE_URL={{ORIGIN}}/api/proxy/perplexity
```

Production hosts need the same variables set in their own settings.

## Keys

There are two kinds of key.

| Key | Prefix | What it can do |
|---|---|---|
| Project key | `kone_live_` | Call any tool through the proxy, and check its own budget |
| Agency key | `kone_admin_` | Manage clients and projects, mint project keys, read spend |

A project key belongs to one client project. It is shown once, when it is issued or rotated; keyone keeps only its hash. Issue or rotate project keys from the project page, and create agency keys in Settings.

Send either key as a bearer token, or as the API key in an SDK:

```bash
curl -X POST {{ORIGIN}}/api/proxy/openai \
  -H "Authorization: Bearer kone_live_…" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-5-mini","messages":[{"role":"user","content":"Hello"}]}'
```

## Providers and endpoints

Everything a provider exposes goes through the same base URL with the project key.

| Provider | Base URL | What goes through |
|---|---|---|
| OpenAI | `/api/proxy/openai/v1` | Chat Completions, Responses, images, embeddings, speech, transcriptions, moderation, `GET /v1/models` |
| Anthropic | `/api/proxy/anthropic` | `/v1/messages` with streaming, tools, thinking, prompt caching and web search; `/v1/messages/count_tokens`; `GET /v1/models` |
| Perplexity | `/api/proxy/perplexity` | Agent API at `/v1/agent`, Search API at `/search` |

Streaming works as it does with the provider. Realtime (WebSocket) APIs are not proxied. For transcriptions, ask for `json` or `verbose_json` so the duration can be billed.

The live list of tools, models and prices is on the [catalog page]({{ORIGIN}}/catalog).

## Model shortcuts

Instead of a model name, `model` can be `cheapest`, `balanced` or `best`. keyone resolves it for that provider from its price table and returns the model it chose in the `X-Model-Resolved` header.

```python
client.chat.completions.create(
    model="cheapest",
    messages=[{"role": "user", "content": "Summarise this ticket."}],
)
```

## Response headers

Every response carries what the call cost, so your own logs can record it.

| Header | Meaning |
|---|---|
| `X-Cost-USD` | What this call cost |
| `X-Call-ID` | The call’s id in keyone |
| `X-Model-Resolved` | The model chosen for a shortcut |
| `X-Project-Budget-Remaining` | Left in the project’s monthly budget, when one is set |
| `X-Client-Budget-Remaining` | Left in the client’s monthly budget, when one is set |

## Checking a budget

Before a large job, ask what the key has left:

```bash
curl {{ORIGIN}}/api/proxy/status \
  -H "Authorization: Bearer kone_live_…"
```

It returns month-to-date spend, the monthly budget and what remains, the per-call cap, allowed tools, the wallet balance and when budgets reset.

## Blocked calls

A `403` with `"status": "BLOCKED"` means a spend control refused the call before it reached the provider. Nothing was sent, and retrying the same call will be refused again.

```json
{
  "status": "BLOCKED",
  "reason": "project_monthly_budget",
  "message": "Project \"Site reports\" has spent $100.0000 of its $100.00 monthly budget.",
  "controls": [
    {
      "type": "PROJECT_MONTHLY_BUDGET",
      "limit_usd": 100,
      "spent_usd": 100,
      "remaining_usd": 0,
      "resets_at": "2026-11-01T00:00:00Z"
    }
  ],
  "hint": "You can request more budget: POST /api/proxy/requests …"
}
```

| Reason | What to do |
|---|---|
| `project_monthly_budget` | Wait for the reset, raise the budget, or request more |
| `client_monthly_budget` | Same, at the client level |
| `project_call_cap` | Lower `max_tokens` or use a cheaper model |
| `project_allowed_apis` | Use a tool this project is allowed to call |
| `project_allowed_models` | Use one of the models listed in the response |
| `key_frozen` | The key spiked and was frozen; the agency unfreezes it from the project page |

The reason is also returned in the `X-Blocked-Reason` header.

## Requesting more budget

When a call is blocked by a monthly budget, the key can ask for more, with a reason and a specific amount:

```bash
curl -X POST {{ORIGIN}}/api/proxy/requests \
  -H "Authorization: Bearer kone_live_…" \
  -H "Content-Type: application/json" \
  -d '{"requested_budget_usd": 75, "reason": "Monthly newsletter run needs about $60; the cap is $50"}'
```

Small increases can be approved automatically; the response then says `"status": "approved"`. Otherwise the agency owner gets an email with approve and deny links. Poll `GET /api/proxy/requests` for the decision. File one request per block, not one per retry.

## Empty wallet

A `402` means the agency wallet is empty. The response includes the balance and a link to top up. Only the agency owner can add funds.

## MCP server

Agents can manage keyone through its MCP server, using an agency key:

```bash
claude mcp add --transport http keyone {{ORIGIN}}/api/mcp \
  --header "Authorization: Bearer kone_admin_…"
```

| Tools | Purpose |
|---|---|
| `keyone_whoami`, `keyone_list_clients`, `keyone_create_client` | The agency and its clients |
| `keyone_list_projects`, `keyone_create_project`, `keyone_update_project`, `keyone_rotate_project_key` | Projects, limits and keys |
| `keyone_get_spend`, `keyone_report`, `keyone_list_models` | Spend, date-ranged reports with rebill amounts, models and prices |
| `keyone_request_budget`, `keyone_list_requests`, `keyone_decide_request` | Budget requests |
| `keyone_list_alerts`, `keyone_unfreeze_key` | Alerts and frozen keys |
| `keyone_controller_run`, `keyone_controller_findings`, `keyone_apply_finding` | The spend controller: review, read findings, apply one |

## REST API

The same operations are available over REST, with an agency key in the `Authorization` header.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/agency` | Agency and wallet |
| GET, POST | `/api/clients` | List or create clients |
| GET, POST | `/api/clients/:id/projects` | List projects, or create one (returns its key once) |
| GET, PATCH | `/api/projects/:id` | Project detail, budgets, allowed tools |
| POST | `/api/projects/:id/keys` | Mint a key; `{"revoke_others": true}` rotates |
| GET | `/api/analytics/overview` | Agency-wide spend |
| GET | `/api/analytics/clients/:id` | Month-to-date spend by project and tool |
| GET | `/api/reports/clients/:id?range=last_month` | Report: totals, by project, tool and model, rebill |
| GET | `/api/reports/clients/:id/export?range=…` | CSV line items for invoicing |
| GET | `/api/reports/agency?range=…` | All clients side by side |
| GET | `/api/pricing` | Models and prices per million tokens |
