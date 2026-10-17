---
title: "How to Estimate AI API Costs Before You Quote a Client Project"
seoTitle: "How to Estimate AI API Costs for a Client Quote"
description: "Measure tokens per run on real samples, apply the formula, add a 30% buffer and put a monthly AI cost in the quote before the client signs."
published: 2026-10-14
author: Julien Devoir
authorRole: Founder
authorImage: /julian.jpg
image: /blog/estimate-ai-api-costs-before-quoting.jpg
---
You can estimate a client’s monthly AI cost in about an hour: measure tokens per run on real samples, multiply by runs and model prices, then add a 30% buffer. That number goes in the quote before the client signs, not after the first bill.

Most agencies skip this step. They quote the build, say “AI usage at cost,” and hope it stays small. Then month one comes in at three times the client’s expectation, because nobody counted the long system prompt, the retries or the two weeks of testing.

This guide gives you the formula, a way to measure tokens before the project starts, a worked example with a calculator table you can copy, and three ways to put the number in your quote.

## The formula

Monthly cost is runs per month, times the cost of one run, times a buffer. The cost of one run is the sum of every AI step’s input and output tokens at that model’s prices.

<figure data-figure="ai-cost-formula"></figure>

**Monthly cost = runs × Σ<sub>steps</sub> (T<sub>in</sub> × P<sub>in</sub> + T<sub>out</sub> × P<sub>out</sub>) ÷ 1,000,000 × 1.3**

T is tokens per run and P is the price per million tokens. Output tokens usually cost 3 to 5 times more than input tokens, so a step that writes long answers can cost more than one that reads long documents.

## How to measure tokens per run before the project starts

Don’t guess tokens from the prompt you wrote. Run a prototype on 10 to 20 real samples from the client and read the actual counts.

1. **Get real inputs.** Ask the client for 20 recent examples of what the workflow will process: emails, leads, PDFs, tickets. Real inputs are longer and messier than the ones you’d invent.
2. **Build a rough version of each AI step.** Same system prompt, same model, same context you’ll pass in production. Leave out the integrations; they don’t cost tokens.
3. **Use a dedicated test key.** Create a key used only for this prototype, so the provider’s usage dashboard shows exactly what the test spent.
4. **Record input and output tokens per step.** Every API response carries a usage object with input and output token counts. Log both, per step, per sample.
5. **Take the average, then check the spread.** Use the average for the estimate. If the longest sample is more than 3 times the average (a 40-page PDF among 2-page ones), estimate that case separately.

Two things to count that people forget: the system prompt is sent on every call, and so is any conversation history or retrieved context. On many workflows those make up most of the input tokens.

No prototype yet? A rough rule for English text is about 4 characters or 0.75 words per token. Use it for a first range, and replace it with measured numbers before the quote is final.

## Worked example: a lead-qualification workflow

A client gets 1,500 inbound leads a month. Each lead runs through three AI steps, and the whole run costs about $0.037, so the base estimate is $55 a month.

Prices below are illustrative (a small model at $0.40 / $1.60 and a mid model at $5 / $15 per million tokens). Replace them with the current prices of the models you’ll use, from each provider’s pricing page.

| Step (model) | Input tokens | Output tokens | Input $/1M | Output $/1M | Cost ($) |
| --- | ---: | ---: | ---: | ---: | ---: |
| Classify the lead (small) | 1,200 | 100 | 0.40 | 1.60 | 0.00064 |
| Write a research summary (mid) | 3,000 | 400 | 5.00 | 15.00 | 0.02100 |
| Draft the reply email (mid) | 2,000 | 350 | 5.00 | 15.00 | 0.01525 |
| Your step |  |  |  |  |  |
| **Total per run** |  |  |  |  | **0.03689** |

Cost per run for a step = input tokens × input price ÷ 1,000,000 + output tokens × output price ÷ 1,000,000. Multiply the total per run by 1,500 runs and you get a base of **$55.34 a month**.

Note what the table shows: the cheap classification step costs 30 times less than the summary. Putting the small model on simple steps is the easiest saving you’ll make before the client ever sees a bill.

## The 30% buffer, and what goes in it

The measured base is what the workflow costs when everything works. Real months add retries, your own testing and growth, so the quote should carry about 30% on top.

<figure data-figure="ai-cost-buffer"></figure>

- **Retries and failed runs (10%).** APIs time out, rate limits hit, and a failed run that’s retried is paid twice. A workflow with no retry caps can blow far past 10% in one night, so [cap them first](/blog/stop-runaway-n8n-loop).
- **Testing and prompt edits (10%).** Every time you tweak a prompt, you rerun samples. That spend lands on the client’s usage unless you test on a separate key.
- **Volume growth (10%).** Clients rarely send fewer leads after automation works. A 10% margin covers normal drift; a launch or a campaign deserves its own estimate.

Adjust each line to the project. A stable internal workflow can run at 15%. A client-facing agent with open-ended conversations needs more than 30%, or a hard cap.

## How to put the number in your quote

Round the buffered estimate up to a clean figure ($72 becomes $75), then pick one of three ways to show it. Each one tells the client what happens if usage runs above the estimate.

| Option | What the quote says | Best when | Your risk |
| --- | --- | --- | --- |
| Included allowance | “Retainer includes up to $75/month of AI usage. Above that, billed at cost with notice.” | Fixed retainers, marketing agencies | Low, if you get alerts before the allowance runs out |
| Estimate + pass-through | “Estimated AI usage: $55 to $75/month, billed monthly at cost plus 15%.” | Clients who want to see real costs | Low, but the client sees every spike |
| Fixed fee with a cap | “AI usage is included. Usage above $100/month needs written approval.” | Small clients who hate variable bills | Highest: you absorb anything under the cap |

Whichever you choose, add two lines to the proposal:

- **What changes the number:** more leads, longer documents, or a new AI step. The client then knows a bigger month is caused by more work, not by your mistake.
- **When you’ll re-estimate:** after the first full month, using real usage. Month one replaces every assumption in this guide with data.

To re-estimate, you need spend broken down by client and by step. If several clients share one key, you can’t get that breakdown. See [How to Track AI Costs per Client](/guides/track-ai-costs-per-client) for how to set that up, and [How to Bill Clients for AI API Usage](/guides/bill-clients-for-ai-api-usage) for the full comparison of billing models.
