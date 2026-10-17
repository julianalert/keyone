---
title: "How Yuzuu knows what each creator’s AI costs against what it earns"
seoTitle: "Yuzuu customer story"
description: "Yuzuu builds AI quiz funnels for Instagram creators for free and keeps 30% of each sale. With a keyone client per creator and a key per stage, it knows what every build and every buyer’s plan costs, next to what that creator sells."
published: 2026-10-17
author: Carine
authorRole: Founder, Yuzuu
authorImage: /carine.jpeg
company: Yuzuu
website: https://www.yuzuu.co
industry: AI digital products for Instagram creators
team: Small team
clients: Instagram creators, 5k to 1M followers
uses: A client per creator, project keys, budgets, per-call caps, client reports
quote: We build every creator’s product for free and only earn when they sell, so the AI bill is our risk. I used to know what we spent in total and what each creator sold, but not whether a given creator had paid back their own build. Now every creator has their own AI cost, and I put it right next to their sales.
highlights: AI cost per creator, split between the build and every buyer’s plan | A budget on every build, so a stage that keeps failing stops at its limit | Each creator’s AI cost next to their sales, every month
disclosure: Carine, who founded Yuzuu, is also keyone’s co-founder, so Yuzuu is not an independent customer.
---
## The company

Yuzuu builds a digital product for Instagram creators with 5,000 to a million followers. It isn’t an ebook or a course. It’s a paid quiz funnel: a follower answers about ten questions, pays, and around ninety seconds later reads a plan written around their own answers. It might be a 14-, 21- or 45-day programme on sleep, training, money or habits, whatever the creator’s audience keeps asking about.

Yuzuu does the work. It reads the creator’s public captions and comments, then proposes three product ideas, each backed by the comments that show people want it. Once the creator picks one, Yuzuu builds the research, the quiz, the buyer types, the content bank, the sales page and the checkout. Every stage is scored and thrown back until it passes. The creator then reviews three sample plans, and nothing goes live without their yes.

The creator pays nothing. Yuzuu keeps 30% of each sale, and card fees come out of its share.

Almost every one of those steps calls an AI model. That is where the question started.

## The challenge

Because the build is free, the whole AI bill sits with Yuzuu, and each creator generates two kinds of cost.

- **The build.** This covers the research, the ideas, each stage that is scored and rejected, and the sample plans. It also covers a second round when a creator throws the ideas back. All of it is spent before the creator has made a single sale. Some of it goes on accounts that are declined, or that never sign up.
- **The plans.** Every sale makes a model write a new, personalised plan. That cost comes with every sale, against roughly $8.10 of revenue on a $27 sale, before card fees.

AI providers send one bill per account, covering every creator at once. Carine could see that total, and she could see each creator’s sales in Stripe. She couldn’t connect the two.

That left three questions she couldn’t answer:

- **How many sales does a creator need before their build is paid for?**
- **What does one buyer’s plan cost?** A 45-day programme isn’t a 14-day one.
- **Which creators are profitable, and which ones is Yuzuu quietly subsidising?**

There was also nothing to stop a stage caught in its score-and-retry loop from going around once too often.

## The setup

Yuzuu’s model calls now go through one keyone account. In the pipeline, only the base URL and the key changed.

- **Each creator is a client** in keyone. The client is created when the build starts, including for an account that hasn’t signed up yet.
- **Each creator has two projects, Build and Plans,** each with its own key. The pipeline uses the Build key while it makes the product, and the Plans key once the product is live.
- **The Build project has a budget.** It is set at what Yuzuu will spend to get a creator live. A stage that keeps failing its checks stops at that limit instead of looping on. The alerts at 50%, 80% and 100% show Carine which build is struggling before it hits the ceiling.
- **The Plans project has a per-call cap, not a tight budget.** A buyer who has paid must get their plan. So the limit applies to what one plan can cost, not to how many plans get written.

At the end of each month, Carine exports the client report: AI cost per creator, split into Build and Plans. She puts it next to each creator’s sales from Stripe.

## The results

- **A cost per creator, not a total.** Every model call is recorded against a creator and a stage as it happens, with no tagging and no reconstruction.
- **Every build has a known ceiling.** A difficult account costs at most its budget. A declined one shows up as exactly what it cost to say no.
- **A cost per buyer.** The Plans spend divided by the number of sales gives the AI cost of one buyer for each creator’s product. That number shapes the price and how long a plan can be.
- **Cost against earnings for every creator.** For each creator, Carine sees how many sales paid back the build and what each new sale adds.

Yuzuu tells creators it only gets paid when they do. Thanks to keyone, Carine can check, creator by creator, whether that payment covers what their product costs to run.
