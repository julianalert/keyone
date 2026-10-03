import type { ReactNode } from 'react'
import { AlertTriangleIcon } from '@/components/marketing/icons/alert-triangle-icon'
import { BellIcon } from '@/components/marketing/icons/bell-icon'
import { CalendarIcon } from '@/components/marketing/icons/calendar-icon'
import { ChartLineIcon } from '@/components/marketing/icons/chart-line-icon'
import { ChartPieCircleIcon } from '@/components/marketing/icons/chart-pie-circle-icon'
import { CheckmarkIcon } from '@/components/marketing/icons/checkmark-icon'
import { ClipboardIcon } from '@/components/marketing/icons/clipboard-icon'
import { ClockIcon } from '@/components/marketing/icons/clock-icon'
import { CodeSquareIcon } from '@/components/marketing/icons/code-square-icon'
import { CpuIcon } from '@/components/marketing/icons/cpu-icon'
import { DocumentIcon } from '@/components/marketing/icons/document-icon'
import { FilterIcon } from '@/components/marketing/icons/filter-icon'
import { KeyIcon } from '@/components/marketing/icons/key-icon'
import { LightingBoltIcon } from '@/components/marketing/icons/lighting-bolt-icon'
import { LockIcon } from '@/components/marketing/icons/lock-icon'
import { MagnifyingGlassIcon } from '@/components/marketing/icons/magnifying-glass-icon'
import { MailIcon } from '@/components/marketing/icons/mail-icon'
import { RepeatIcon } from '@/components/marketing/icons/repeat-icon'
import { ShieldExclamationIcon } from '@/components/marketing/icons/shield-exclamation-icon'
import { SlidersIcon } from '@/components/marketing/icons/sliders-icon'
import { SparklesIcon } from '@/components/marketing/icons/sparkles-icon'
import { TagIcon } from '@/components/marketing/icons/tag-icon'
import { TerminalIcon } from '@/components/marketing/icons/terminal-icon'
import { User2Icon } from '@/components/marketing/icons/user-2-icon'
import { UserArrowRightIcon } from '@/components/marketing/icons/user-arrow-right-icon'
import {
  AlertsDemo,
  AppliedDemo,
  BlockedDemo,
  BreakdownDemo,
  BudgetDemo,
  CallsDemo,
  ClientReportDemo,
  ConnectDemo,
  CsvDemo,
  DigestDemo,
  FindingsDemo,
  KeysDemo,
  ProjectListDemo,
  ReportDemo,
  SpendOverviewDemo,
} from './demos'

/*
 * Product pages. Each one follows PAS: the Problem the agency has today, what it
 * costs them (Agitate), then how keyone Solves it. The shared layout is in
 * product-page.tsx; add a page by adding an entry here.
 */

type Wallpaper = 'green' | 'blue' | 'purple' | 'brown'

export interface ProductPageContent {
  slug: string
  // Navbar, footer and index cards
  name: string
  tagline: string
  icon: ReactNode
  // SEO
  metaTitle: string
  metaDescription: string
  // Hero
  headline: string
  accent: string
  subheadline: string
  heroDemo: ReactNode
  wallpaper: Wallpaper
  // Problem
  problem: { headline: string; items: { icon: ReactNode; title: string; body: string }[] }
  // Agitate
  agitate: { headline: string; body: string; stats: { stat: string; text: string }[] }
  // Solution
  solution: {
    headline: string
    subheadline: string
    features: { title: string; body: string; points: string[]; demo: ReactNode; wallpaper: Wallpaper }[]
    extras: { icon: ReactNode; title: string; body: string }[]
  }
  steps: { title: string; body: string }[]
  guideSlug?: string
  faqs: { q: string; a: string }[]
}

export const productPages: ProductPageContent[] = [
  /* ---------------------------------------------------------------- */
  {
    slug: 'cost-tracking',
    name: 'Cost tracking',
    tagline: 'Live AI spend per client, project and model',
    icon: <ChartPieCircleIcon />,
    metaTitle: 'AI cost tracking per client',
    metaDescription:
      'Track AI costs per client automatically. keyone records every call against its client, project, tool and model, so you always know what each client’s AI costs.',
    headline: 'See what every client’s AI costs,',
    accent: 'as it happens.',
    subheadline:
      'Every call is recorded against its client, project, tool and model the moment it runs. No tagging, no spreadsheets, no rebuilding the bill at month end.',
    heroDemo: <SpendOverviewDemo />,
    wallpaper: 'green',
    problem: {
      headline: 'Your providers bill your agency, not your clients.',
      items: [
        {
          icon: <DocumentIcon />,
          title: 'One invoice for every client',
          body: 'OpenAI and Anthropic send one bill for your whole account. Which client spent what is not on it.',
        },
        {
          icon: <FilterIcon />,
          title: 'A different dashboard for every tool',
          body: 'Each provider reports usage its own way. Adding it up per client means exports, formulas and guesswork.',
        },
        {
          icon: <KeyIcon />,
          title: 'Shared keys hide the answer',
          body: 'When two client workflows share a key, their costs merge. No report can separate them afterwards.',
        },
      ],
    },
    agitate: {
      headline: 'What you can’t attribute, you end up absorbing.',
      body: 'Without per-client numbers, overages stay with your agency. You can’t rebill what you can’t prove, and you can’t price a retainer on a cost you have never seen.',
      stats: [
        { stat: '1 bill', text: 'from each provider, covering every client you run on that account.' },
        { stat: '5', text: 'provider dashboards to open when a client asks what their AI actually cost.' },
        { stat: 'Every month', text: 'a lost afternoon splitting provider bills per client by hand.' },
      ],
    },
    solution: {
      headline: 'Every call lands on the right client, automatically.',
      subheadline:
        'Each client project calls keyone with its own key, so attribution is built in. There is nothing to tag and nothing to reconcile.',
      features: [
        {
          title: 'Live spend by client',
          body: 'Open the dashboard and see this month’s spend for every client and project, updated with each call.',
          points: [
            'Spend per client, per project, per tool and per model',
            'Calls today and this month, across every provider',
            'Each client’s spend shown against its budget',
          ],
          demo: <BreakdownDemo />,
          wallpaper: 'green',
        },
        {
          title: 'Drill down to the single call',
          body: 'Break any client down by project, tool or model, then down to individual calls with their tokens, cost and status.',
          points: [
            'Views by project, by tool and by model',
            'Every call: model, tokens, cost and time',
            'Blocked calls listed with the limit that stopped them',
          ],
          demo: <CallsDemo />,
          wallpaper: 'blue',
        },
      ],
      extras: [
        {
          icon: <TagIcon />,
          title: 'The cost travels with the call',
          body: 'Every API response carries what that call cost, so your own logs and automations can use it too.',
        },
        {
          icon: <ChartLineIcon />,
          title: 'One view across providers',
          body: 'Every tool in the catalog lands in the same per-client view, in the same currency.',
        },
        {
          icon: <TerminalIcon />,
          title: 'Your agents can ask too',
          body: 'Claude Code, Cursor or your own agent can pull a client’s spend report through keyone’s MCP server.',
        },
      ],
    },
    steps: [
      { title: 'Add the client and its projects', body: 'Mirror how you already work: Durand Construction → Quote generator.' },
      { title: 'Use the project key', body: 'Swap the provider keys in that client’s automations for its keyone project key.' },
      { title: 'Watch the spend land', body: 'Each call shows up under the right client and project as it runs.' },
    ],
    guideSlug: 'track-ai-costs-per-client',
    faqs: [
      {
        q: 'Do I have to tag requests with a client?',
        a: 'No. Each client project has its own key, and the key identifies the client and project. There is nothing to add to your requests.',
      },
      {
        q: 'How up to date is the spend?',
        a: 'Each call is recorded when it completes, so the dashboard reflects what your automations have spent so far today.',
      },
      {
        q: 'Can I see cost per model and per tool?',
        a: 'Yes. Any client can be broken down by project, by tool or by model, and each call shows its model, tokens and cost.',
      },
      {
        q: 'Does it cover usage outside keyone?',
        a: 'No. keyone tracks the calls that go through it. Usage on provider keys you still use directly, and unrelated subscriptions, stay outside these reports.',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: 'budgets',
    name: 'Budgets & limits',
    tagline: 'Budgets, per-call caps, alerts and auto-freeze',
    icon: <SlidersIcon />,
    metaTitle: 'AI budgets and spend limits per client',
    metaDescription:
      'Set AI budgets per client and per project, cap the cost of a call and choose allowed models. keyone checks every limit before the call reaches the provider.',
    headline: 'Stop overspend',
    accent: 'before the call runs.',
    subheadline:
      'Set a monthly budget per client and per project, cap the cost of a single call, and choose which tools and models each project may use. keyone checks every limit before the call reaches the provider.',
    heroDemo: <BudgetDemo />,
    wallpaper: 'brown',
    problem: {
      headline: 'Provider limits protect your account, not your clients.',
      items: [
        {
          icon: <ShieldExclamationIcon />,
          title: 'Limits are account-wide',
          body: 'A provider spend limit covers your whole organisation. It can’t tell one client’s budget from another’s.',
        },
        {
          icon: <ClockIcon />,
          title: 'Alerts arrive after the money is spent',
          body: 'A billing email the next morning doesn’t stop a loop that ran all night.',
        },
        {
          icon: <RepeatIcon />,
          title: 'Automations don’t know when to stop',
          body: 'A workflow that retries on error keeps retrying. Nothing in it knows the client’s budget.',
        },
      ],
    },
    agitate: {
      headline: 'One runaway loop can cost more than the retainer.',
      body: 'Every client you sign adds workflows that can loop and costs you can’t cap. When one of them overruns, your agency pays first and argues about it later.',
      stats: [
        { stat: '$400', text: 'burned overnight by one retry loop, on a client paying you a $300 retainer.' },
        { stat: '0', text: 'budgets per client on a provider account shared by all of them.' },
        { stat: '2 AM', text: 'is when loops run, and nobody is watching a dashboard.' },
      ],
    },
    solution: {
      headline: 'Limits that hold, per client and per project.',
      subheadline:
        'Budgets, caps and allowed models are checked before each call. A call over a limit never reaches the provider.',
      features: [
        {
          title: 'Budgets, per-call caps and allowed models',
          body: 'Give every client and every project its own monthly budget, cap what a single call may cost, and restrict a project to the tools and models it needs.',
          points: [
            'Monthly budgets per client and per project',
            'A maximum cost per call',
            'Allowed tools and models for each project',
          ],
          demo: <SpendOverviewDemo />,
          wallpaper: 'brown',
        },
        {
          title: 'Blocked calls explain themselves',
          body: 'A call over a limit is refused with a 403 and a machine-readable reason: which limit, how much was spent and when it resets. Your agent can read it and tell you.',
          points: [
            'Refused before the call reaches the provider',
            'The limit, the amount spent and the reset date in the response',
            'A hint telling the agent how to request more budget',
          ],
          demo: <BlockedDemo />,
          wallpaper: 'purple',
        },
        {
          title: 'Alerts, auto-freeze and one-click approvals',
          body: 'Hear about a budget before it is reached, have a spiking key frozen on its own, and approve an agent’s request for more room from your inbox.',
          points: [
            'Email and webhook alerts at 50, 80 and 100% of every budget',
            'A key spending many times its normal hourly rate is frozen alone',
            'Budget requests you approve or deny from the email',
          ],
          demo: <AlertsDemo />,
          wallpaper: 'green',
        },
      ],
      extras: [
        {
          icon: <BellIcon />,
          title: 'Once per threshold, not a flood',
          body: 'Each alert fires one time per budget and per month, by email and to your webhook.',
        },
        {
          icon: <LightingBoltIcon />,
          title: 'A freeze touches one key',
          body: 'When a key is frozen for a spending spike, every other client and project keeps running.',
        },
        {
          icon: <CheckmarkIcon />,
          title: 'Small increases can approve themselves',
          body: 'Set a threshold under which budget requests are approved automatically, and decide the rest yourself.',
        },
      ],
    },
    steps: [
      { title: 'Set the budgets', body: 'Add a monthly budget to each client and each project when you create them.' },
      { title: 'Add caps and allowed tools', body: 'Limit the cost of one call and the tools and models a project can use.' },
      { title: 'Decide on the exceptions', body: 'Get the alerts, and approve or deny budget requests from your inbox.' },
    ],
    guideSlug: 'track-ai-costs-per-client',
    faqs: [
      {
        q: 'What happens when a budget is reached?',
        a: 'keyone checks configured limits before sending a call to the provider. Calls that exceed a limit are refused with a machine-readable reason, and budget alerts help you decide when to adjust a limit.',
      },
      {
        q: 'Can a blocked workflow ask for more budget?',
        a: 'Yes. The blocked response tells the agent how to request more, with a reason. Small increases can be approved automatically; for the rest you get an email with approve and deny links.',
      },
      {
        q: 'Does freezing a key affect my other clients?',
        a: 'No. A freeze applies to the single key that spiked. Every other client and project keeps running, and you can unfreeze the key from its project page.',
      },
      {
        q: 'Is a budget the same as an alert?',
        a: 'No. Alerts tell you a budget is being approached. The budget itself is enforced: calls that would exceed it are refused.',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: 'client-reports',
    name: 'Client reports',
    tagline: 'Reports and CSV exports with your markup',
    icon: <DocumentIcon />,
    metaTitle: 'Client AI usage reports and rebilling',
    metaDescription:
      'Turn AI usage into client-ready reports. Set a markup per client and export line items with cost, price and rebill amount, ready for your invoicing.',
    headline: 'Client-ready AI cost reports,',
    accent: 'with your markup.',
    subheadline:
      'Set a markup per client, pick the period, and export line items ready for your invoice, whether you rebill usage or include it in your retainer.',
    heroDemo: <ReportDemo />,
    wallpaper: 'blue',
    problem: {
      headline: 'Month end means rebuilding the AI bill by hand.',
      items: [
        {
          icon: <MagnifyingGlassIcon />,
          title: 'Provider exports don’t know your clients',
          body: 'Usage files list models and tokens. Turning them into “what Durand owes” is manual work, every month.',
        },
        {
          icon: <ClipboardIcon />,
          title: 'Your markup lives in a spreadsheet',
          body: 'Each client has its own rate, applied by formula, copied from last month’s file.',
        },
        {
          icon: <User2Icon />,
          title: 'Clients ask what they’re paying for',
          body: 'A single “AI usage” line with no breakdown invites questions you then have to answer by hand.',
        },
      ],
    },
    agitate: {
      headline: 'If you can’t show it, you can’t bill it.',
      body: 'Usage you can’t attribute never reaches an invoice, so it comes out of your margin. And a number without a breakdown behind it is a number a client can dispute.',
      stats: [
        { stat: 'Hours', text: 'spent each month matching provider exports to clients and projects.' },
        { stat: 'Unbilled', text: 'usage is paid by your agency when it can’t be traced to a client.' },
        { stat: 'Disputes', text: 'start when a client sees a total with nothing to back it up.' },
      ],
    },
    solution: {
      headline: 'One report per client, ready to invoice.',
      subheadline:
        'keyone already knows which client made every call. Reports add your markup and give you the export; you send the invoice.',
      features: [
        {
          title: 'Spend and rebill, side by side',
          body: 'See what each client cost you and what you will charge them, with each client’s own markup applied.',
          points: [
            'A markup per client',
            'This month, last month or a custom period',
            'Broken down by project, by tool or by model',
          ],
          demo: <ClientReportDemo />,
          wallpaper: 'blue',
        },
        {
          title: 'Line items for your invoicing',
          body: 'Export a client’s calls as CSV with price and rebill amount in every row, or the whole agency by client and project.',
          points: [
            'One row per call: date, project, tool, model and tokens',
            'Price and rebill amount in every row, plus a total',
            'Opens in any spreadsheet or invoicing tool',
          ],
          demo: <CsvDemo />,
          wallpaper: 'brown',
        },
      ],
      extras: [
        {
          icon: <CalendarIcon />,
          title: 'Any period you bill on',
          body: 'Run a report for this month, last month or the exact dates of your billing cycle.',
        },
        {
          icon: <TagIcon />,
          title: 'Retainer or rebill',
          body: 'Use the same report to invoice usage or to check consumption against the allowance in a retainer.',
        },
        {
          icon: <MailIcon />,
          title: 'You stay the one who invoices',
          body: 'keyone prepares reports and exports. Your clients keep receiving invoices from you, in your process.',
        },
      ],
    },
    steps: [
      { title: 'Set each client’s markup', body: 'Enter the percentage you add to that client’s usage, once.' },
      { title: 'Pick the period', body: 'Choose this month, last month or custom dates when it’s time to bill.' },
      { title: 'Export and invoice', body: 'Download the CSV and add the line items to your invoice.' },
    ],
    guideSlug: 'bill-clients-for-ai-api-usage',
    faqs: [
      {
        q: 'Does keyone send invoices to my clients?',
        a: 'No. keyone prepares client reports and CSV exports with your configured markup. You use those line items in your existing invoicing process.',
      },
      {
        q: 'Can each client have a different markup?',
        a: 'Yes. The markup is set per client and applied to that client’s reports and exports.',
      },
      {
        q: 'What is in the CSV export?',
        a: 'One row per call with its date, project, tool, model, tokens, price and rebill amount, followed by a total for the period. An agency-wide export by client and project is also available.',
      },
      {
        q: 'What if AI usage is included in my retainer?',
        a: 'Use the report to compare each client’s consumption with the allowance you included, and to see when a client is outgrowing it.',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: 'project-keys',
    name: 'Project keys',
    tagline: 'One key per client project, for every tool',
    icon: <KeyIcon />,
    metaTitle: 'One API key per client project',
    metaDescription:
      'Replace dozens of provider keys with one keyone key per client project. It works for every tool in the catalog, with no provider accounts to set up per client.',
    headline: 'One key per client project.',
    accent: 'Every tool behind it.',
    subheadline:
      'Give each client project a single keyone key that works across the whole catalog. No provider accounts, cards or keys to set up for each client.',
    heroDemo: <KeysDemo />,
    wallpaper: 'purple',
    problem: {
      headline: 'Ten clients, four tools each: forty API keys to manage.',
      items: [
        {
          icon: <KeyIcon />,
          title: 'A key for every tool, for every client',
          body: 'Each new client means a new OpenAI key, a new Anthropic key, a new Perplexity key. You create and store all of them.',
        },
        {
          icon: <MagnifyingGlassIcon />,
          title: 'Keys scattered everywhere',
          body: 'They live in .env files, n8n credentials and Make connections. Nobody has the full list.',
        },
        {
          icon: <AlertTriangleIcon />,
          title: 'Offboarding breaks things',
          body: 'Revoke a key that two clients turned out to share, and the wrong automation stops.',
        },
      ],
    },
    agitate: {
      headline: 'Every key you can’t place is a risk.',
      body: 'A key nobody remembers creating still works. If it leaks, it spends against your account until someone notices, and finding out which workflow used it takes longer than replacing it.',
      stats: [
        { stat: '40+', text: 'keys to create, store, rotate and revoke once you run four tools for ten clients.' },
        { stat: '1', text: 'shared key is enough to make a client impossible to offboard cleanly.' },
        { stat: '?', text: 'is the honest answer to “where is this key used?” for most of them.' },
      ],
    },
    solution: {
      headline: 'A key that maps to the work.',
      subheadline:
        'keyone holds the provider access. Your agency has one account and one wallet, and each client project has one key.',
      features: [
        {
          title: 'Issue, rotate and revoke per project',
          body: 'Every key belongs to one client project. Replace a leaked key or offboard a client without touching anyone else.',
          points: [
            'Onboard a client in a minute: create the project, copy the key',
            'Rotate or revoke a key from its project page',
            'Several keys per project when environments need their own',
          ],
          demo: <ProjectListDemo />,
          wallpaper: 'purple',
        },
        {
          title: 'A drop-in for the SDKs you already use',
          body: 'Change the base URL and the key in your OpenAI or Anthropic SDK. The same key then reaches every other tool in the catalog.',
          points: [
            'Works with the OpenAI and Anthropic SDKs',
            'Streaming, tools and provider headers pass through',
            'Add a tool to a client’s workflow without a new key',
          ],
          demo: <ConnectDemo />,
          wallpaper: 'green',
        },
      ],
      extras: [
        {
          icon: <LockIcon />,
          title: 'Stored as hashes',
          body: 'A key is shown once when it is issued. keyone keeps only its hash, never the readable value.',
        },
        {
          icon: <SlidersIcon />,
          title: 'Scoped to what the project needs',
          body: 'Restrict each project to the tools and models it should use, so a key can’t wander.',
        },
        {
          icon: <UserArrowRightIcon />,
          title: 'Agents can set themselves up',
          body: 'Point Claude Code or Cursor at keyone’s skill file and it installs the key and wires the project.',
        },
      ],
    },
    steps: [
      { title: 'Create the project', body: 'Add the client, then a project for each workflow you run for them.' },
      { title: 'Copy its key', body: 'The project key is issued on the spot and works for every tool.' },
      { title: 'Swap it in', body: 'Replace the provider keys in that automation with the project key and base URL.' },
    ],
    guideSlug: 'manage-api-keys-multiple-clients',
    faqs: [
      {
        q: 'Do I need my own provider accounts?',
        a: 'No. keyone provides access to its supported catalogue through your account and prepaid wallet. Each client project gets its own keyone API key.',
      },
      {
        q: 'What if a project key leaks?',
        a: 'Rotate it from the project page: the old key stops working and a new one is issued. A key that suddenly spends many times its normal rate is also frozen automatically.',
      },
      {
        q: 'Can a project have more than one key?',
        a: 'Yes. You can issue additional keys for a project, for example one per environment, and revoke each one separately.',
      },
      {
        q: 'Which tools can I connect it to?',
        a: 'Any tool or code that lets you set a base URL and an API key for the OpenAI or Anthropic API, plus direct HTTP calls for the other tools in the catalog.',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: 'controller',
    name: 'Controller',
    tagline: 'A daily spend review that proposes the fix',
    icon: <SparklesIcon />,
    metaTitle: 'Controller: a daily AI spend review',
    metaDescription:
      'The keyone controller reviews your agency’s AI spend every morning, flags drift, premium models on small tasks and idle budgets, and proposes fixes you apply in one click.',
    headline: 'A daily spend review',
    accent: 'you don’t have to run.',
    subheadline:
      'Every morning the controller reviews your agency’s spend, flags what is off and proposes the fix. Nothing changes until you click Apply.',
    heroDemo: <FindingsDemo />,
    wallpaper: 'green',
    problem: {
      headline: 'Nobody has time to review AI spend every day.',
      items: [
        {
          icon: <ChartLineIcon />,
          title: 'Drift goes unnoticed',
          body: 'A project that costs a little more each week never triggers an alarm, until the month is over.',
        },
        {
          icon: <CpuIcon />,
          title: 'Premium models on small tasks',
          body: 'A workflow built on the best model keeps using it for jobs a cheaper one would handle.',
        },
        {
          icon: <SlidersIcon />,
          title: 'Budgets set once, never revisited',
          body: 'A generous budget on a quiet project is exposure: a leaked key could spend all of it.',
        },
      ],
    },
    agitate: {
      headline: 'Small leaks add up across clients.',
      body: 'One inefficient workflow is a rounding error. Ten of them, across ten clients, is margin you gave away without deciding to. Finding them means reading reports nobody opens.',
      stats: [
        { stat: 'Daily', text: 'is how often spend changes, and almost never how often it gets reviewed.' },
        { stat: '10×', text: 'the clients means ten times the projects, models and budgets to keep an eye on.' },
        { stat: 'After', text: 'the month closes is when most agencies find out what went wrong.' },
      ],
    },
    solution: {
      headline: 'A reviewer that reads every number, every day.',
      subheadline:
        'The controller computes its findings from your real spend, then writes them up in plain language with a proposed fix for each.',
      features: [
        {
          title: 'A digest you can read in a minute',
          body: 'Each morning you get a short summary of what needs attention, ordered by what matters most.',
          points: [
            'Burn rate against each budget',
            'Cost drift from one week to the next',
            'Idle budgets and repeated blocked calls',
          ],
          demo: <DigestDemo />,
          wallpaper: 'green',
        },
        {
          title: 'Findings with a one-click fix',
          body: 'Every finding comes with a concrete proposal: a new budget, a per-call cap, a cheaper allowed model. Apply it or dismiss it.',
          points: [
            'Apply a proposal in one click, or dismiss it',
            'Nothing changes until you decide',
            'A history of what was applied and dismissed',
          ],
          demo: <AppliedDemo />,
          wallpaper: 'brown',
        },
      ],
      extras: [
        {
          icon: <CheckmarkIcon />,
          title: 'It never invents numbers',
          body: 'Findings are calculated from your spend data first. The written digest can only say what those findings contain.',
        },
        {
          icon: <ClockIcon />,
          title: 'Daily, or when you ask',
          body: 'The review runs every morning, and you can run it again whenever you want a fresh look.',
        },
        {
          icon: <CodeSquareIcon />,
          title: 'Available to your agents',
          body: 'Your own agent can run the review, read the findings and apply one through keyone’s MCP server.',
        },
      ],
    },
    steps: [
      { title: 'Run your clients through keyone', body: 'The controller works from the spend keyone already records.' },
      { title: 'Read the morning digest', body: 'Open the spend review page, or get the summary by email.' },
      { title: 'Apply what makes sense', body: 'Accept a proposed fix in one click, and dismiss the rest.' },
    ],
    guideSlug: 'track-ai-costs-per-client',
    faqs: [
      {
        q: 'Does the controller change anything on its own?',
        a: 'No. It notices, explains and proposes. A budget, cap or allowed model only changes when you click Apply on a finding.',
      },
      {
        q: 'What does it look for?',
        a: 'Burn rate against budgets, cost drift, premium models used on small tasks, idle budgets, repeated blocked calls, waste, missing markups and budget requests left unanswered.',
      },
      {
        q: 'Does it read my prompts or my clients’ data?',
        a: 'No. It works from spend figures: amounts, models, budgets and client and project names. It does not use the content of your requests.',
      },
      {
        q: 'Does the review cost extra?',
        a: 'No. The controller is included, and running it does not draw on your wallet.',
      },
    ],
  },
]

export function getProductPage(slug: string) {
  return productPages.find(p => p.slug === slug) ?? null
}
