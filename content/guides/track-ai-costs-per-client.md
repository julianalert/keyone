---
title: "How to Track AI Costs per Client: A Practical Guide for Agencies"
description: "Learn how to track AI costs per client across providers, reconcile monthly spend, set budgets and understand what usage means for your agency’s margins."
published: 2026-09-13
icon: chart
author: Carine
authorImage: /carine.jpeg
---
Your AI bill is $300 this month. How much belongs to each client?

If answering that means opening several dashboards, matching API keys to workflows and rebuilding a spreadsheet, your reporting process is becoming part of the delivery work.

That matters whether you rebill consumption or include it in a retainer. You need to know which client generated the cost, what caused it and whether it fits the budget you agreed.

**To track AI costs per client, connect usage to a client and workflow, collect costs across providers, allocate shared expenses consistently and reconcile the result against provider billing records. Then compare each client’s total with their budget.**

You can start with a spreadsheet. The foundation is a reliable connection between every charge and the work that generated it.

## 1. Decide what belongs in your client cost report

An automation can use more than an AI model. A lead-research workflow might make model calls, run searches and retrieve company data. Tracking only its tokens leaves part of its cost invisible.

Separate your expenses into four categories:

| Category | Examples | How to record it |
|---|---|---|
| Direct AI consumption | Model calls, embeddings, transcription, image generation | Assign to the client and workflow that used it |
| Other direct usage | Search, scraping and data-enrichment calls | Assign to the client and workflow that used it |
| Shared platform costs | Automation subscriptions, shared hosting | Allocate using a documented rule, or keep as agency overhead |
| Internal agency usage | Demos, experiments, internal assistants | Record separately from client production usage |

Decide who paid, too. A client-owned provider account can generate costs you need to monitor without creating an expense your agency should rebill. Add a payer field so those amounts remain distinct.

Finally, define the report’s scope. A report covering model calls is an AI consumption report. Adding hosting and automation costs gives you a broader view of technical delivery costs. Neither tells you full client profitability until you account for labour and other delivery expenses.

## 2. Give usage a client identity before it happens

The easiest cost to assign is one that already carries a client identifier.

Use a structure your team can recognise:

**Client → Workflow → Environment → Provider**

For example, Acme’s support assistant in production should be distinguishable from Acme’s document-processing workflow and your internal testing.

Use stable identifiers such as `acme-support-production`. Keep a mapping between that identifier and the relevant provider project, workspace or credential ID. Store credential references in the report, never the secret API keys themselves.

There are several ways to create this separation:

| Method | Useful when | What to check |
|---|---|---|
| Separate provider accounts | Clients own their provider relationships | Whether you have permission to access reporting |
| Provider projects or workspaces | Your agency manages several clients under one organisation | Which reporting dimensions and controls are available |
| Dedicated credentials | Each client or workflow has its own integration | Whether usage can actually be reported by credential |
| Request-level records | A shared application serves multiple clients | Whether every request retains the correct client identity |

For OpenAI, projects support separating work and viewing usage within that scope. Anthropic workspaces provide a similar organisational boundary, with usage and cost reporting by workspace. See the official [OpenAI project documentation](https://help.openai.com/en/articles/9186755-managing-projects-in-the-api-platform) and [Anthropic workspace documentation](https://platform.claude.com/docs/en/manage-claude/workspaces).

A separate key is useful only if you can connect its usage to the right client in your reporting. Renaming a credential does not automatically create cost attribution. For setting up and maintaining that separation, see [how to manage API keys for multiple clients](/guides/manage-api-keys-multiple-clients).

For a shared workflow, attach the client identity before the first billable action and retain it through subsequent calls. If a single job processes work for several clients, you need either more granular records or an explicit allocation rule.

Keep development usage visible. Whether you absorb that expense or charge it to a client is a commercial decision; your cost records should preserve what happened.

## 3. Collect comparable records across providers

Start with provider usage reports, cost exports or billing records. If you need automated collection, check the provider’s reporting API and its access requirements.

For example, Anthropic’s Usage and Cost Admin API provides historical usage and cost information. Its usage and cost endpoints expose different breakdowns, so do not assume every usage dimension also exists in the cost report. Consult the [official API documentation](https://platform.claude.com/docs/en/manage-claude/usage-cost-api) when building the integration.

Your ledger should capture these fields:

| Field | Why it matters |
|---|---|
| Date or reporting period | Places the cost in the right month |
| Client, workflow and environment | Identifies the work that generated it |
| Provider and model or service | Explains what was consumed |
| Usage quantity and unit | Distinguishes tokens, requests, minutes or results |
| Cost and original currency | Preserves the source amount |
| Payer | Separates agency-funded and client-funded usage |
| Attribution method | Identifies direct, allocated and unassigned costs |
| Source reference | Makes the record traceable |
| Cost status | Distinguishes estimates from reconciled charges |

Choose a consistent level of detail. One row per client, workflow, provider and day may be sufficient for monthly reporting. Request-level records become useful when investigating expensive runs or unexpected retries.

When a provider reports usage before final costs are available, you can estimate consumption cost using the applicable rates. Preserve relevant billing distinctions, such as input, output and cached usage, rather than applying one price to every token.

Label those figures as estimates. Provider adjustments, discounts and other billed items can create differences between your calculation and the final charge.

If your providers bill in different currencies, retain the original amounts and use a documented conversion basis for your reporting currency. Never add euros and dollars into a single total without conversion.

## 4. Build the report: a three-client example

Imagine an agency running three workflows:

- **Client A:** a customer-support assistant using OpenAI and Perplexity.
- **Client B:** document processing using Anthropic and OpenAI.
- **Client C:** content workflows using OpenAI and Anthropic.

The agency also pays $60 per month for a shared automation platform.

**All figures below are fictional monthly costs in USD. They illustrate reporting mechanics, not provider prices or expected customer spend. Taxes, credits and currency conversion are excluded.**

First, assign direct provider charges:

| Client | OpenAI | Anthropic | Perplexity | Direct costs |
|---|---:|---:|---:|---:|
| Client A | $70 | $0 | $20 | $90 |
| Client B | $30 | $120 | $0 | $150 |
| Client C | $40 | $20 | $0 | $60 |
| **Total** | **$140** | **$140** | **$20** | **$300** |

Next, decide how to handle the shared $60 subscription. In this example, the agency allocates it using recorded workflow executions:

| Client | Executions | Share | Allocated platform cost |
|---|---:|---:|---:|
| Client A | 2,000 | 33.33% | $20 |
| Client B | 3,000 | 50.00% | $30 |
| Client C | 1,000 | 16.67% | $10 |
| **Total** | **6,000** | **100%** | **$60** |

The calculation is:

**Client allocation = shared expense × client executions ÷ total executions**

Execution count is a choice, not a universal measure of resource consumption. If one client’s jobs take far longer, execution duration may be more appropriate. You can also retain a subscription as agency overhead instead of allocating it.

Whichever method you choose, state it and use it consistently. An allocated subscription cost should not appear as a directly measured provider charge.

The resulting client summary looks like this:

| Client | Direct costs | Shared allocation | Total tracked costs | Monthly budget | Remaining |
|---|---:|---:|---:|---:|---:|
| Client A | $90 | $20 | $110 | $150 | $40 |
| Client B | $150 | $30 | $180 | $200 | $20 |
| Client C | $60 | $10 | $70 | $100 | $30 |
| **Total** | **$300** | **$60** | **$360** | **$450** | **$90** |

Here, budgets cover both direct consumption and the shared allocation. If your agreement covers only API consumption, compare the budget with that narrower total.

Client B has used 90% of its $200 allowance. You now know which client needs attention and can trace its $180 total back to the underlying costs.

## 5. Reconcile the report before using it for billing

A report can look precise while missing an entire project.

For each provider, check that your records account for the same reporting period and scope as its usage or billing records:

**Client-attributed usage + internal usage + unassigned usage = total recorded usage cost**

Then explain the bridge from recorded usage cost to the billed amount: credits, adjustments, taxes and any other invoice items.

Investigate differences rather than distributing them across clients to make the totals match. Common causes include:

- A workflow still using an old or shared credential.
- Records arriving after the report was generated.
- Different reporting time zones or billing periods.
- Charged attempts omitted because the workflow ultimately failed.
- Duplicate imports or overlapping date ranges.
- Credits or discounts missing from internal calculations.

If you cannot identify a charge, leave it under **Unassigned** with a note. That is a visible reporting problem you can fix. Quietly assigning it to a client creates a billing problem instead.

Also distinguish wallet funding from consumption. A $500 prepaid top-up does not mean clients consumed $500 that month. Track the balance movement separately from the cost of services used.

Once the report reconciles, retain its source records and mark the period as reviewed. If later adjustments arrive, keep an explanation of what changed.

## 6. Use budgets before the month is over

Monthly reporting explains what happened. In-month monitoring gives you time to respond.

Set a consumption budget for each client and name the person responsible for reviewing it. An example alert policy could be:

| Threshold | Action |
|---|---|
| 50% used | Check whether consumption matches the expected pace |
| 80% used | Review the likely month-end total and major cost drivers |
| 100% used | Apply the agreed policy: approve more spend, restrict work or pause it |

Timing changes the meaning. Spending $180 of a $200 allowance by day 28 is different from reaching $180 on day 10.

For steady workloads, a simple forecast is:

**Projected monthly cost = cost so far ÷ elapsed days × days in the month**

At $180 after 10 days in a 30-day month, that projects to $540. Treat it as a prompt to investigate; a one-off batch or seasonal workload can make the projection misleading.

Be explicit about enforcement. An alert sends a notification. A hard limit can interrupt requests. OpenAI’s current documentation describes both spend alerts and enforceable limits, so verify the setting you have actually enabled rather than relying on a label such as “budget.” See its [spend-limit documentation](https://developers.openai.com/api/docs/guides/spend-limits).

A provider-level limit also covers only that provider’s applicable scope. A client using several services needs a combined view if the budget is meant to cover all of them.

Before enforcing a stop, decide what the workflow should do: queue work, notify an operator or return a clear message. Assign responsibility for approving increases. A spending control needs an operational response.

## 7. Connect consumption to your retainer economics

Suppose Client B pays a $1,000 monthly retainer and generates $180 in tracked technical costs.

That leaves $820 before labour and other costs. It is not $820 of profit.

If the retainer includes a $200 usage allowance, the client has $20 of allowance remaining. Keep that measure separate from the amount left to cover delivery and agency overhead.

For each client, compare consumption over time with revenue, delivery effort and the allowance you included. If usage grows, investigate whether the increase reflects valuable additional work, a more expensive implementation or unnecessary requests.

Your cost report establishes what the service costs to run. Your commercial agreement determines what the client pays. Record markup, management fees and overages separately from the underlying consumption cost. To choose how to charge for it, see [how to bill clients for AI API usage](/guides/bill-clients-for-ai-api-usage).

## A simple spreadsheet structure you can copy

Use three tabs to implement this process:

| Tab | Contents |
|---|---|
| **Usage ledger** | Period, client, workflow, environment, provider, service, usage, cost, currency, payer, attribution, source and status |
| **Client summary** | Direct costs, shared allocation, total, budget, remaining allowance and budget percentage used |
| **Reconciliation** | Provider totals, internal totals, adjustments, unexplained differences and review notes |

The summary needs three basic calculations:

- **Total tracked cost = direct costs + allocated shared costs.**
- **Remaining allowance = budget − costs covered by that budget.**
- **Budget used = costs covered by the budget ÷ budget.**

Flag missing amounts and missing budgets explicitly. A blank cost is unknown, not zero. A client with no configured budget should appear as “No budget,” not 0% used.

## When to automate client cost tracking

A spreadsheet can work well when your mapping is stable and reporting takes little effort. Consider automation when you repeatedly repair client assignments, combine several providers per workflow or discover spend problems too late to act.

Evaluate automation against your actual setup: provider coverage, attribution detail, reporting freshness, estimates versus billed costs, budget enforcement and exportability.

Keyone’s approach is to organise supported usage around clients and projects. Its published workflow uses an agency-funded wallet and one Keyone key per client project, with spend reporting and configurable limits. This fits agencies choosing to fund and manage consumption centrally.

To evaluate it, start with one project:

1. Create the client and project in Keyone.
2. Configure a budget and the controls appropriate for that workflow.
3. Update a supported integration to use the project key and the relevant Keyone endpoint.
4. Run a small test and inspect the recorded client, project and cost.
5. Check how the workflow handles a refused request before relying on limits in production.
6. Review the export against your reporting and invoicing needs.

Keyone’s public site describes client reports and CSV exports with configurable markup. Those exports feed your existing invoicing process; they do not mean Keyone sends invoices to clients.

Keep the scope clear. Traffic that bypasses Keyone and unrelated subscriptions still need to be accounted for. If clients must retain their own provider accounts and pay providers directly, Keyone’s current agency-funded model may not fit that arrangement.

**Know what each client costs before deciding what to charge. [Explore Keyone](https://getkeyone.com/).**
