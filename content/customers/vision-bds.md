---
title: "How Vision BDS runs AI for a dozen construction companies from one account"
seoTitle: "Vision BDS customer story"
description: "Vision BDS, an AI automation agency for the construction industry, replaced a set of provider keys per client with one keyone account, a key and a budget per client project, and an export at month end."
published: 2026-10-02
author: Clément Bernard
authorRole: Co-founder, Vision BDS
authorImage: /clement.jpg
company: Vision BDS
website: https://visionbds.com
industry: AI automation agency for construction
location: France
team: Three partners
clients: About a dozen construction companies
uses: Project keys, budgets, client reports
quote: We run automations for a dozen construction companies, and I was managing a separate set of API keys for each of them, then rebuilding the AI bill by hand every month. Now it’s one account, one key per client project with a budget, and invoicing is an export.
highlights: One account instead of a set of provider keys per client | A key and a monthly budget for every client project | Month-end AI billing from an export, not a spreadsheet
disclosure: Vision BDS is the agency keyone was built in. Julien Devoir, keyone’s founder, is one of its three partners, and keyone was made to solve this problem for Vision BDS first.
---
## The agency

Vision BDS is an AI automation agency that works with one industry only: construction. Its clients range from one-person trades to contractors with 150 employees, and they all lose hours to the same administrative work.

Vision BDS removes that work with automations built on each client’s own documents: a price database made from supplier invoices, quotes assembled instead of written, progress billing, payment reminders, site tracking and financial dashboards. A partner leads every project, and the first automation is usually in production within three weeks.

Every one of those automations calls AI models. That is where the problem started.

## The challenge

Running AI for a dozen companies meant running a dozen sets of credentials. Each client needed its own keys for each provider its automations used, created and stored by the agency, in whatever tool the workflow lived in.

The cost side was worse. Providers send one bill per account, for every client at once. At the end of each month, someone at Vision BDS rebuilt the AI bill by hand to work out what each construction company had consumed.

Two things were missing:

- **A boundary per client.** Nothing separated one client’s usage, or one client’s keys, from the next.
- **A number per client.** What a client’s AI cost only existed after an afternoon in a spreadsheet.

## The setup

Vision BDS moved its client work onto one keyone account, organised the way the agency already works.

- **Each construction company is a client** in keyone.
- **Each automation is a project** under that client, with its own key.
- **Each project has a monthly budget**, checked before every call.

The provider keys that used to sit in each client’s workflows were replaced by that project’s keyone key. Adding a tool to a client’s automation no longer means a new account or a new secret.

## The results

- **One account instead of a set of keys per client.** The agency manages a key per client project, not a key per tool per client.
- **A budget on every client project.** A workflow that runs away is stopped at its own limit, without touching the other clients.
- **Month-end billing is an export.** Each client’s usage is already attributed, so the AI line on the invoice comes from a report instead of a reconstruction.

Vision BDS exists to remove repetitive admin work for its clients. Its own month-end AI billing was the same kind of task, and it is gone.
