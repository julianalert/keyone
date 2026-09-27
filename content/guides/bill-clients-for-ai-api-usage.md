---
title: "How to Bill Clients for AI API Usage: 4 Models Compared"
description: "Compare four ways to bill clients for AI API usage, with a sample invoice, retainer calculation and a clear explanation of markup versus margin."
published: 2026-09-20
icon: banknotes
author: Carine
authorImage: /carine.jpeg
---
You have built the automation. It works. Your client is happy.

Then the provider charges arrive.

Should the client pay OpenAI directly? Should you add the usage to your invoice? And if your monthly retainer includes AI costs, what happens when consumption doubles?

These decisions are easier to make before the workflow goes live. Otherwise, you can end up funding usage you never priced, explaining charges the client did not expect or managing a separate billing arrangement for every account.

**There are four practical ways to bill clients for AI API usage: let clients pay providers directly, rebill consumption with a fee or markup, include an allowance in a fixed retainer, or sell usage tiers with overages.**

Choose based on who should own the provider accounts, how predictable consumption is and how much billing administration your agency is willing to handle.

*All prices, usage amounts and percentages in this guide are illustrative. They are not provider prices, industry benchmarks or recommended agency rates. Calculations exclude taxes and currency conversion unless stated otherwise.*

## Start with two separate decisions

The first decision is **who pays the provider**. The second is **how you charge for your service**.

A client can own its provider accounts and still pay you a monthly management retainer. Your agency can fund the provider usage and charge a fixed service fee plus variable consumption.

Keeping these decisions separate prevents a common pricing mistake: treating API usage as if it were the whole service.

Your fee may cover implementation, maintenance, monitoring, support and improvements. Provider consumption is one cost of delivering that service. Its size does not necessarily reflect the value you create or the effort required to support it.

## The four models at a glance

| Model | Who pays providers? | What the client pays your agency | Strongest fit | Main trade-off |
|---|---|---|---|---|
| Client pays directly | Client | Implementation and/or management fees | Clients that want ownership and direct billing | More client onboarding and account coordination |
| Cost plus fee or markup | Agency | Service fee, actual eligible consumption and agreed usage fee | Variable consumption that needs to remain visible | Variable invoices and agency cash exposure |
| Retainer with allowance | Agency | Fixed fee including a defined amount of usage | Recurring workflows with reasonably predictable costs | Agency absorbs variation within the allowance |
| Usage tiers with overages | Agency | Selected package plus usage beyond its allowance | Repeatable services with a measurable unit | More metering and pricing design |

These are commercial arrangements. You still need a reliable record of each client’s usage. If you cannot separate their costs, start with [how to track AI costs per client](/guides/track-ai-costs-per-client).

## Model 1: The client pays providers directly

The client creates and funds its provider accounts. Your agency receives the access needed to build and operate the agreed workflows, and invoices separately for its services.

For example:

| Payment | Recipient | Monthly amount |
|---|---|---:|
| Automation management | Agency | $800 |
| AI API consumption | Providers | $180 |
| **Combined client spend** | | **$980** |

Your agency invoices $800. It does not collect the $180 of provider charges.

This can be a strong choice when the client wants control over its accounts, has an internal technical team or expects to take over the automation later. It also avoids your agency having to fund consumption while waiting for reimbursement.

The operational cost is coordination. Somebody must create accounts, arrange access, resolve payment failures and approve changes to limits. A workflow using several providers can involve several separate onboarding steps. To organise that access, see [how to manage API keys for multiple clients](/guides/manage-api-keys-multiple-clients).

Agree on who monitors usage and who responds when funding or access fails. Direct billing removes the rebilling task, but it does not automatically remove your responsibility to keep the workflow running.

**Choose this model when account ownership matters more than consolidating provider payments.** You can still charge for monitoring and management; those activities should have a clear place in your service fee.

## Model 2: Rebill consumption with a fee or markup

Your agency pays the providers, attributes usage to each client and adds the agreed charges to its invoice.

There are two common ways to price the usage component:

- **Actual cost plus a fixed management fee:** $180 consumption plus $50 administration.
- **Actual cost plus a percentage markup:** $180 consumption plus 30%, or $234 in total.

A fixed fee can suit work that stays broadly similar as consumption changes. A percentage markup makes the fee rise with spend, but that may not match your support effort. A low-usage client can still need substantial help.

Keep your core service fee separate when it covers different work. Explain what the usage fee adds so the invoice does not appear to charge twice for the same management activity.

### A worked monthly invoice

Here is an illustrative invoice breakdown for document processing. The service fee covers workflow maintenance and support; the usage management fee covers the agreed administration of agency-funded consumption.

| Line item | Calculation | Amount |
|---|---|---:|
| Workflow maintenance and support | Monthly fee | $800.00 |
| OpenAI usage | Attributed monthly cost | $30.00 |
| Anthropic usage | Attributed monthly cost | $120.00 |
| Search and data API usage | Attributed monthly cost | $30.00 |
| Usage management fee | 30% × $180.00 | $54.00 |
| **Subtotal before applicable taxes** | | **$1,034.00** |

Attach a usage report with the reporting period, relevant workflows and cost breakdown. The invoice itself can stay concise.

Define “cost” before using a cost-plus model. Is it your actual billed consumption after applicable discounts and credits? Does it include platform fees? Which currency conversion basis applies? If you charge your own rate card instead, label it as your usage pricing rather than provider cost passed through unchanged.

### Markup is not gross margin

A 30% markup on $180 gives a selling price of $234:

**Price = cost × (1 + markup)**

The difference is $54. As a percentage of the $234 selling price, that is **23.1%**, not 30%.

To price for a 30% margin against that consumption cost alone:

**Price = cost ÷ (1 − target margin)**

**$180 ÷ 0.70 = $257.14**, rounded to cents.

| Approach | Consumption cost | Usage selling price | Difference | Difference as % of selling price |
|---|---:|---:|---:|---:|
| 30% markup | $180.00 | $234.00 | $54.00 | 23.1% |
| 30% margin against consumption cost | $180.00 | $257.14 | $77.14 | 30.0% |

These figures exclude payment fees, support and other delivery costs. They do not represent the profitability of the whole client account.

**Choose cost plus when usage varies and clients want a clear connection between consumption and their bill.** Monitor how much consumption your agency funds before payment arrives.

## Model 3: Include a usage allowance in the retainer

The client pays a fixed monthly fee that includes a defined amount of consumption.

For example: **$1,000 per month, including up to $200 of eligible API consumption at your agency’s cost.**

That is more precise than “AI usage included.” It tells both sides what the allowance measures.

This arrangement can make buying simpler for clients who want an operating service and a predictable bill. Your agency carries the variation within the included allowance.

### A worked retainer calculation

Suppose the monthly retainer is $1,000:

| Delivery item | Expected cost |
|---|---:|
| Support and maintenance labour | $250 |
| Allocated platform and hosting costs | $50 |
| AI and other eligible API consumption | $120 |
| **Total expected delivery costs** | **$420** |
| **Amount remaining before other overhead and taxes** | **$580** |

Now test different consumption levels:

| API consumption | Total delivery costs | Retainer remaining after these costs |
|---|---:|---:|
| $120 expected usage | $420 | $580 |
| $200 full allowance | $500 | $500 |
| $400 without additional charges | $700 | $300 |

At $200 of consumption, the client is still within the offer. At $400, you need the overage policy you agreed before launch.

Possible policies include approving an additional budget, charging consumption above the allowance at an agreed rate or pausing defined work pending approval. Pick an explicit policy instead of relying on a future conversation.

For a new workflow without useful history, begin with a bounded pilot and a stated review point. Estimate consumption from representative runs and expected volume, then compare it with observed costs. If the economics remain too uncertain, separate consumption from the service fee until you have better data.

Be clear about unused allowance. An included allowance that resets monthly is different from a prepaid balance that rolls over. The client should know which one they are buying.

**Choose a retainer with allowance when consumption is predictable enough to price responsibly and the client values a stable monthly bill.**

## Model 4: Offer usage tiers with overages

If you deliver a repeatable service, you can package it around units the client understands: documents processed, reports generated or another clearly defined activity.

For an illustrative document-processing service:

| Plan | Monthly price | Included standard documents | Additional standard document |
|---|---:|---:|---:|
| Starter | $500 | 1,000 | $0.40 |
| Growth | $1,000 | 3,000 | $0.30 |
| Scale | $1,800 | 6,000 | $0.25 |

A Growth client processing 3,600 eligible documents would pay:

**$1,000 + (600 × $0.30) = $1,180.**

The client buys a service package. Your agency still measures the underlying provider costs to understand whether that package works economically.

Define a “standard document.” Without a size or complexity boundary, a one-page receipt and a 200-page scanned report could count as the same unit while costing very different amounts to process.

Also decide when a unit becomes billable. Does a completed result count once? What happens on a customer-requested rerun? Do internal retries create additional client units? Your meter and your client-facing explanation must agree.

This model overlaps with the retainer approach: both can combine a fixed fee with overages. The useful distinction is that a bespoke retainer often includes a cost allowance, while repeatable packages can use standard service units.

Billing tools can implement these arrangements; for example, Stripe documents [fixed-fee-plus-overage and other usage-based pricing models](https://docs.stripe.com/subscriptions/pricing-models/usage-based-pricing). The software still needs an accurate meter and a well-defined billable event.

**Choose tiers when you have a repeatable offer and understand how usage units translate into delivery costs.**

## Which model should your agency choose?

Start with your operating constraints:

| Your situation | Starting point | Reason |
|---|---|---|
| Client requires its own accounts and provider billing | Client pays directly | Matches the ownership requirement |
| Consumption is unpredictable and measurable | Cost plus fee or markup | Keeps variable spend visible |
| Workload is stable and the client wants one predictable fee | Retainer with allowance | Makes the monthly commitment clear |
| You sell essentially the same workflow to many clients | Usage tiers with overages | Creates a repeatable commercial offer |
| You have little data on a new workflow | Bounded pilot, then reassess | Establishes evidence before committing to an allowance |

You do not need one model for every client. You do need consistent rules within each arrangement. Record the payer, rate, allowance, approval contact and billing period in a single client billing profile.

## Agree on the details that cause disputes

Before launch, make these points explicit in the proposal and operating setup:

| Decision | What to specify |
|---|---|
| Scope | Which workflows, providers and charges are covered |
| Charging basis | Actual eligible cost, your rate card or defined service units |
| Included usage | Allowance, reset date and rollover behaviour |
| Overage | Rate, approval process and any maximum authorised spend |
| Failures and retries | Which consumed resources or service units are chargeable |
| Development | Whether testing and changes are included or separate |
| Adjustments | How credits, corrected records and late-reported usage are handled |
| Price changes | How revised provider costs or agency rates will be communicated |
| Payment timing | When the service fee and usage charges become payable |
| Operational limits | What happens when the budget or funding runs out |

An API request costing your agency money does not automatically make it a billable client item. Preserve the cost record, then apply your agreed policy. Costs caused by an implementation problem may need different treatment from ordinary production usage.

A budget alert is also different from spending authorisation. Decide who can approve additional consumption and how that decision reaches the workflow. If an enforced limit stops requests, define what happens to pending work.

For agency-funded usage, consider whether billing in arrears leaves you carrying an uncomfortable amount of client consumption. Shorter settlement periods or prepaid usage can reduce that exposure, but they require clear balance and credit records.

## Turn usage records into a monthly bill

A repeatable close process keeps consumption and billing connected:

1. **Close the reporting period.** Use consistent dates and time zones across the relevant sources.
2. **Reconcile client costs.** Identify missing attribution, duplicates, internal testing and adjustments before pricing the usage.
3. **Apply the client’s commercial rules.** Deduct included usage where appropriate, calculate eligible overages and add the agreed fee.
4. **Review exceptions.** Check approved budget increases, disputed runs and any agency-absorbed costs.
5. **Prepare the invoice and supporting report.** Show enough detail to explain the total without requiring the client to understand every API call.
6. **Record payment and adjustments.** Preserve the link between usage, invoice and any prepaid balance or later credit.

Never charge the full consumption amount again when part of it is already included in a retainer. If eligible usage costs $260 and the plan includes $200 at the same cost basis, only $60 is above the allowance. Any overage markup applies according to the agreed policy.

Likewise, wallet funding and usage are different events. Topping up an agency wallet does not establish which client consumed the money or what that client owes.

## Where Keyone fits

For agencies funding consumption centrally, Keyone is designed to connect provider access and spending with clients and projects.

Its published workflow uses an agency-funded wallet and a key per client project. The site describes client spending reports, configurable budgets and CSV exports with client-specific markup.

That makes it relevant to the operational side of cost-plus billing: attribute usage, review client costs, apply a markup and export the line items into your invoicing process. Its cost visibility can also help you monitor consumption included in retainers.

Keep the boundary clear. Keyone’s public site describes reports and exports, not sending invoices to clients. A markup export should not be assumed to calculate custom allowances, service-unit tiers or your entire billing policy automatically.

If the client must keep its own provider accounts and pay providers directly, Keyone’s current agency-funded model may not suit that requirement. And costs outside its supported, routed usage still need to be included in your reporting where relevant.

**Make the billing agreement clear, then give it reliable usage data. [Explore Keyone](https://getkeyone.com/) to organise agency-managed consumption by client.**
