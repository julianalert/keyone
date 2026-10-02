---
title: "A word from the founder: the manifesto"
seoTitle: "The keyone manifesto"
description: "Why I built keyone, what I think is broken in how agencies pay for AI, and the seven things we believe about keys, spend and control."
published: 2026-09-11
author: Julien Devoir
authorRole: Founder
authorImage: /julian.jpg
---
I run an agency. We build AI automations for clients, and for a long time I could not answer the simplest question a client can ask: what did my AI cost this month?

I could tell them what the agency paid OpenAI. I could tell them what we paid Anthropic. I could not tell them, without an afternoon in a spreadsheet, what *their* share was. And I could not promise it would be about the same next month.

**keyone exists because an agency should know what every client’s AI costs, before the invoice, and be able to stop it before it runs away.**

This is what I think is broken, and what we believe instead.

## What is broken

AI providers were built for a company using AI for itself. One account, one bill, one team. An agency is a different animal: one account doing work for ten businesses that each expect their own number.

So agencies improvise. A key for every tool, for every client. Keys in `.env` files, in n8n, in Make. A spreadsheet at month end that tries to turn a provider export into ten invoices. A spend limit that covers the whole account and protects nobody in particular.

It works until it doesn’t. A workflow loops overnight. A client asks for a breakdown you can’t produce. Someone leaves, and nobody knows which key they created or what breaks if you revoke it.

None of this is the agency being careless. The tools were not designed for the way agencies work.

## What we believe

### 1. A cost belongs to a client the moment it happens

Attribution done afterwards is reconstruction, and reconstruction is guesswork. In keyone every call carries its client and its project from the start, because the key it used belongs to exactly one project. There is nothing to tag and nothing to reconcile.

### 2. A limit that doesn’t stop the call is not a limit

An email the next morning is a report, not a control. A budget has to be checked before the call reaches the provider, and a call that would exceed it has to be refused. That is how budgets, per-call caps and allowed models work in keyone.

### 3. Keys should map to the work, not to the vendor

One key per client project, for every tool that project uses. When a client leaves, you revoke their keys and nothing else moves. When a key leaks, you rotate one key, not forty.

### 4. Agents are users too

More and more of the calls an agency pays for are made by agents, not people. So a refusal has to be something an agent can read: which limit, how much was spent, when it resets, and how to ask for more. An agent that hits a budget should be able to request an increase with a reason, and a human should be able to say yes or no in one click.

### 5. Nothing changes without a human saying yes

keyone reviews your spend every day and proposes fixes: a lower budget on an idle project, a cheaper model for a small task. It never applies them on its own. Software that manages money should explain itself and wait.

### 6. Pricing you can explain in one sentence

Provider cost plus 30%, from a prepaid wallet. No subscription, no seats, no contract. If we can’t explain what you pay in one sentence, we don’t deserve to bill you for helping you explain what your clients pay.

### 7. The client relationship is yours

Your clients never see keyone. They don’t get a login, a key or an invoice from us. We prepare the report and the export with your markup; you send the invoice, in your name, the way you always have.

## What this is not

keyone is not a way to hide AI costs from clients, and it is not a way to mark them up in the dark. The agencies I respect show their clients what the work costs and charge fairly for running it. Our job is to make that number exist.

It is also not a walled garden. keyone is a drop-in for the SDKs you already use: you came in by changing a base URL and a key, and you can leave the same way.

## Where this is going

Today keyone covers the models most agencies run on, plus search. The catalog will grow, because a client project rarely stops at one provider, and every tool we add is one fewer account, card and key for you to manage.

The direction does not change: one account for your agency, one key per client project, every call attributed, every limit enforced, and a clear number for every client.

## An invitation

If you run AI for other people’s businesses, start with one client project. Connect it, set a budget, and look at the number at the end of the week.

If it’s the first time you have seen that number, that is the point.

*Julien*
