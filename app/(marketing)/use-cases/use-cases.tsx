import type { ReactNode } from 'react'
import { AlertTriangleIcon } from '@/components/marketing/icons/alert-triangle-icon'
import { BanknotesIcon } from '@/components/marketing/icons/banknotes-icon'
import { BellIcon } from '@/components/marketing/icons/bell-icon'
import { ChartLineIcon } from '@/components/marketing/icons/chart-line-icon'
import { ChartPieCircleIcon } from '@/components/marketing/icons/chart-pie-circle-icon'
import { ClockIcon } from '@/components/marketing/icons/clock-icon'
import { CodeSquareIcon } from '@/components/marketing/icons/code-square-icon'
import { CpuIcon } from '@/components/marketing/icons/cpu-icon'
import { DocumentIcon } from '@/components/marketing/icons/document-icon'
import { KeyIcon } from '@/components/marketing/icons/key-icon'
import { LockIcon } from '@/components/marketing/icons/lock-icon'
import { RepeatIcon } from '@/components/marketing/icons/repeat-icon'
import { SparklesIcon } from '@/components/marketing/icons/sparkles-icon'
import { TerminalIcon } from '@/components/marketing/icons/terminal-icon'
import { User2Icon } from '@/components/marketing/icons/user-2-icon'
import { UserArrowRightIcon } from '@/components/marketing/icons/user-arrow-right-icon'
import {
  BlockedDemo,
  BreakdownDemo,
  BudgetDemo,
  ClientReportDemo,
  ConnectDemo,
  CsvDemo,
  ProjectListDemo,
  ReportDemo,
} from '../product/demos'
import type { WorkspaceDemoProps } from './demos'

/*
 * Use-case pages: one per kind of business that runs AI for clients. Same product,
 * same vocabulary (clients and projects), different first paragraph: the reader's
 * own tools, examples, pains and billing habits. The shared layout is in
 * use-case-page.tsx; add a use case by adding an entry here.
 */

type Wallpaper = 'green' | 'blue' | 'purple' | 'brown'

export interface UseCaseContent {
  slug: string
  // Navbar, footer and index cards
  name: string
  // "For <audience>": hero eyebrow and index heading
  audience: string
  tagline: string
  icon: ReactNode
  // SEO
  metaTitle: string
  metaDescription: string
  // Hero
  headline: string
  accent: string
  subheadline: string
  workspace: WorkspaceDemoProps
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
  // Product pages this reader will use most (slugs from ../product/pages.tsx)
  productSlugs: string[]
  guideSlug?: string
  faqs: { q: string; a: string }[]
}

const TOOLS = ['OpenAI', 'Anthropic', 'Perplexity']

export const useCases: UseCaseContent[] = [
  /* ---------------------------------------------------------------- */
  {
    slug: 'ai-automation-agencies',
    name: 'AI automation agencies',
    audience: 'AI automation agencies',
    tagline: 'n8n, Make and custom agents for many clients',
    icon: <CpuIcon />,
    metaTitle: 'keyone for AI automation agencies',
    metaDescription:
      'One keyone account for your AI automation agency: a key per client project for every tool, budgets enforced before each call, and a per-client report to rebill. Works with n8n, Make and custom code.',
    headline: 'Run every client’s automations',
    accent: 'on one key each.',
    subheadline:
      'Your workflows call OpenAI, Anthropic and Perplexity for a dozen clients. Give each client project one keyone key, cap it, and know what each client cost before the invoice goes out.',
    workspace: {
      owner: 'Your agency',
      clients: [
        { name: 'Durand Construction', projects: ['Quote generator', 'Site reports'] },
        { name: 'Nova Dental', projects: ['Appointment reminders'] },
        { name: 'Fleet Logistics', projects: ['Dispatch summaries'] },
      ],
      tools: TOOLS,
    },
    wallpaper: 'green',
    problem: {
      headline: 'Every workflow holds a key, and every client has ten workflows.',
      items: [
        {
          icon: <KeyIcon />,
          title: 'Credentials everywhere',
          body: 'n8n credentials, Make connections, .env files on a VPS. Each one is a provider key tied to your agency account, and nobody remembers which client it belongs to.',
        },
        {
          icon: <RepeatIcon />,
          title: 'Loops run on your card',
          body: 'A retry loop at 2 AM spends your agency’s money. The provider limit protects your whole account, not the client whose workflow broke.',
        },
        {
          icon: <DocumentIcon />,
          title: 'Month end is a spreadsheet',
          body: 'One OpenAI invoice, one Anthropic invoice, and an afternoon turning them into per-client numbers you can defend.',
        },
      ],
    },
    agitate: {
      headline: 'Automation scales. Your key management doesn’t.',
      body: 'Every client you sign adds a key per tool, more workflows that can loop, and more cost you can’t prove. The gap between what you paid the providers and what you can rebill is your margin leaking.',
      stats: [
        { stat: '40+', text: 'keys to create, store, rotate and revoke once you run four tools for ten clients.' },
        { stat: '$400', text: 'burned overnight by one retry loop, on a client paying you a $300 retainer.' },
        { stat: '0', text: 'provider dashboards that show spend per client.' },
      ],
    },
    solution: {
      headline: 'One account for the agency. One key per client project.',
      subheadline:
        'Replace the provider credentials in each client’s workflows with that project’s keyone key. Every call is attributed, capped and priced before it reaches the provider.',
      features: [
        {
          title: 'Drop it into n8n, Make or code',
          body: 'keyone is a drop-in for the OpenAI and Anthropic APIs. Change the base URL and the key in the credential, and the workflow keeps working, now with a budget around it.',
          points: [
            'OpenAI and Anthropic SDK compatible, streaming included',
            'One credential per client in n8n or Make instead of one per tool',
            'Perplexity and the rest of the catalog on the same key',
          ],
          demo: <ConnectDemo />,
          wallpaper: 'green',
        },
        {
          title: 'Brakes per client, not per account',
          body: 'Monthly budgets per client and per project, per-call caps and allowed models, all checked before the call. When a workflow loops, keyone freezes that key and nothing else.',
          points: [
            'Budgets enforced before the provider is called',
            'Spike auto-freeze on one key while every other client keeps running',
            'Blocked calls return a reason your agent can read',
          ],
          demo: <BlockedDemo />,
          wallpaper: 'blue',
        },
        {
          title: 'Rebill from an export, not a spreadsheet',
          body: 'Set a markup per client and export line items at month end. Cost, price and rebill amount in every row.',
          points: ['Per-client report for any date range', 'CSV ready for your invoicing tool', 'Your markup never shows in client-facing numbers'],
          demo: <ClientReportDemo />,
          wallpaper: 'brown',
        },
      ],
      extras: [
        {
          icon: <TerminalIcon />,
          title: 'Agents set themselves up',
          body: 'Claude Code, Cursor or your own agent can create clients, mint project keys and check spend through keyone’s MCP server.',
        },
        {
          icon: <BellIcon />,
          title: 'Alerts before the client calls',
          body: 'An email and a webhook at 50, 80 and 100% of every client and project budget.',
        },
        {
          icon: <ChartLineIcon />,
          title: 'A daily spend review',
          body: 'The controller flags premium models on trivial tasks and idle budgets, and proposes the fix. Nothing changes until you click Apply.',
        },
      ],
    },
    steps: [
      { title: 'Create the client and its projects', body: 'Durand Construction → Quote generator, Site reports. Set a monthly budget on each.' },
      {
        title: 'Swap the credential',
        body: 'In n8n or Make, replace the OpenAI and Anthropic credentials with the project key and the keyone base URL.',
      },
      { title: 'Run, watch, rebill', body: 'Spend lands on the right client as it runs. Export the CSV at month end and send the invoice.' },
    ],
    productSlugs: ['project-keys', 'budgets', 'client-reports'],
    guideSlug: 'manage-api-keys-multiple-clients',
    faqs: [
      {
        q: 'Does it work with n8n and Make?',
        a: 'Yes. Both call the OpenAI and Anthropic APIs under the hood. Point the credential at the keyone base URL and use the project key as the API key. The developer docs show the exact fields.',
      },
      {
        q: 'What if a client wants to pay the providers directly?',
        a: 'keyone runs on your agency’s prepaid wallet. If a client must keep their own provider account and direct billing, that client is better left outside keyone.',
      },
      {
        q: 'Can one client have several keys?',
        a: 'Yes. Each project has its own key, and a project can hold more than one key for rotation. Revoking a key never touches the project’s history or budget.',
      },
      {
        q: 'Which tools are covered?',
        a: 'OpenAI, Anthropic and Perplexity today, with more added over time. The catalog page lists every tool, model and price a project key can call.',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: 'marketing-agencies',
    name: 'Marketing agencies',
    audience: 'marketing agencies',
    tagline: 'AI inside content, research and reporting retainers',
    icon: <SparklesIcon />,
    metaTitle: 'keyone for marketing agencies',
    metaDescription:
      'Add AI to client retainers without losing track of the cost. keyone gives your marketing agency one key per client, a budget per client, and a clean breakdown to include in the retainer or rebill.',
    headline: 'Put AI in every retainer,',
    accent: 'and know what it costs.',
    subheadline:
      'Content, research, reporting and ad copy now run on AI for every client you serve. keyone gives each client its own key and budget, so the cost shows up where it belongs: on that client.',
    workspace: {
      owner: 'Your agency',
      clients: [
        { name: 'Lumen Skincare', projects: ['Social captions', 'Blog drafts'] },
        { name: 'Nordic Bikes', projects: ['SEO briefs'] },
        { name: 'Café Rosa', projects: ['Review replies'] },
      ],
      tools: TOOLS,
    },
    wallpaper: 'purple',
    problem: {
      headline: 'AI slipped into the retainer. The cost slipped into overhead.',
      items: [
        {
          icon: <SparklesIcon />,
          title: 'Every service now uses AI',
          body: 'Briefs, captions, research, reporting. Each one calls a model, often from a different tool, on a key the whole team shares.',
        },
        {
          icon: <DocumentIcon />,
          title: 'One bill, twenty clients',
          body: 'The provider invoice covers every account manager’s work for every client. Nobody can say which retainer the cost belongs to.',
        },
        {
          icon: <ChartPieCircleIcon />,
          title: 'Retainers priced on a guess',
          body: 'You priced the AI line before you had seen a real number. Some clients are subsidizing others, and you cannot tell which.',
        },
      ],
    },
    agitate: {
      headline: 'Small per client. Large across the agency.',
      body: 'Three dollars a day per client is nothing. Thirty clients for a year is a salary, paid out of margin, and never shown to the clients who caused it.',
      stats: [
        { stat: '$3/day', text: 'per client is about $33,000 a year across thirty retainers, unattributed.' },
        { stat: '1 key', text: 'shared across the content team, so one client’s campaign spike looks like everyone’s.' },
        { stat: '0', text: 'line items you can show when a client asks what the AI in their retainer cost.' },
      ],
    },
    solution: {
      headline: 'A key and a budget per client, from the first brief.',
      subheadline:
        'Set up each client once. Every tool your team uses for that client runs on that client’s key, and the spend rolls up to a number you can bring to the retainer review.',
      features: [
        {
          title: 'See what each retainer’s AI costs',
          body: 'Live spend per client, per project and per model. Price the AI line in the next renewal on the real number.',
          points: ['Spend by client, project, tool and model', 'Month to date or any date range', 'Calls and blocked calls per project'],
          demo: <BreakdownDemo />,
          wallpaper: 'purple',
        },
        {
          title: 'Cap campaigns before they overspend',
          body: 'A monthly budget per client, a smaller one per campaign project, and allowed models so a caption generator never runs on the most expensive model.',
          points: ['Budgets checked before the call', 'Allowed models per project', 'Alerts at 50, 80 and 100%'],
          demo: <BudgetDemo />,
          wallpaper: 'blue',
        },
        {
          title: 'Include it or rebill it, with the receipt',
          body: 'Export a per-client report with your markup. Attach it to the invoice, or bring it to the retainer review.',
          points: ['Markup per client', 'CSV with cost, price and rebill amount', 'Clients never see keyone'],
          demo: <ReportDemo />,
          wallpaper: 'brown',
        },
      ],
      extras: [
        {
          icon: <UserArrowRightIcon />,
          title: 'Onboard a client in a minute',
          body: 'New retainer, new client, new key. Lose a client, revoke the key, and nothing else moves.',
        },
        {
          icon: <KeyIcon />,
          title: 'No more shared team key',
          body: 'Each client project has its own key, so a spike is traceable to one client and one campaign.',
        },
        {
          icon: <ChartLineIcon />,
          title: 'A daily spend review',
          body: 'The controller flags drift, premium models on trivial work and idle budgets, and proposes the fix.',
        },
      ],
    },
    steps: [
      { title: 'Add a client per retainer', body: 'Lumen Skincare → Social captions, Blog drafts. Set the budget you priced into the retainer.' },
      {
        title: 'Use the project key in your tools',
        body: 'In the scripts, custom GPT actions and automations your team runs for that client, replace the provider key with the project key.',
      },
      { title: 'Review at renewal', body: 'Open the client report. Reprice the AI line on a real number, or attach the export to the invoice.' },
    ],
    productSlugs: ['cost-tracking', 'budgets', 'client-reports'],
    guideSlug: 'bill-clients-for-ai-api-usage',
    faqs: [
      {
        q: 'We use ChatGPT seats, not the API. Does keyone help?',
        a: 'keyone tracks API calls; seat subscriptions stay outside it. Agencies usually move repeatable work such as captions, briefs and reporting onto the API because it is cheaper per task and can then be attributed per client.',
      },
      {
        q: 'Should we include AI in the retainer or rebill it?',
        a: 'Both work. keyone gives you the per-client number either way, with a markup setting if you rebill. Our billing guide compares four models with a sample invoice.',
      },
      {
        q: 'Can account managers see only their own clients?',
        a: 'Team members share the agency workspace today, with owner, admin and member roles. Per-client visibility for members is not available yet.',
      },
      {
        q: 'Do my clients need an account?',
        a: 'No. keyone is your agency’s workspace. Your clients receive your report and your invoice, in your name.',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: 'freelancers',
    name: 'Freelancers & consultants',
    audience: 'freelancers and consultants',
    tagline: 'Automation builders running AI for several clients',
    icon: <User2Icon />,
    metaTitle: 'keyone for freelance automation builders and consultants',
    metaDescription:
      'Run AI for several clients on your own? keyone gives you one key per client project, a budget each so no client can run up your card, and a report to bill from. No subscription, prepaid, from $5.',
    headline: 'Your clients’ AI,',
    accent: 'not your credit card.',
    subheadline:
      'You build automations for five clients and pay the providers yourself. keyone puts each client on its own key and budget, so a runaway workflow can only spend what that client is good for, and billing is an export.',
    workspace: {
      owner: 'You',
      ownerNote: 'One prepaid wallet',
      clients: [
        { name: 'Dr. Patel Dental', projects: ['Reminder texts'] },
        { name: 'Hills Realty', projects: ['Listing descriptions', 'Lead replies'] },
        { name: 'Oak & Iron Furniture', projects: ['Quote follow-ups'] },
      ],
      tools: TOOLS,
    },
    wallpaper: 'brown',
    problem: {
      headline: 'Five clients, one provider account, your name on the card.',
      items: [
        {
          icon: <BanknotesIcon />,
          title: 'You front the cost',
          body: 'The OpenAI bill hits your card. You invoice clients weeks later, from a number you reconstructed.',
        },
        {
          icon: <AlertTriangleIcon />,
          title: 'One loop is a bad month',
          body: 'A client’s workflow loops over a weekend. The provider limit is on your account, so it protects nothing until your whole business stops.',
        },
        {
          icon: <ClockIcon />,
          title: 'Admin eats the evening',
          body: 'Rotating keys when a client leaves, splitting the invoice, answering “what did the AI cost?” from a spreadsheet.',
        },
      ],
    },
    agitate: {
      headline: 'The smallest shop carries the most risk per client.',
      body: 'An agency absorbs a bad month. For a freelancer, one unbounded loop on a $500 project can wipe out the quarter’s margin, and the client will still expect the invoice to match the quote.',
      stats: [
        { stat: '$500', text: 'project that can lose a quarter’s margin to one unbounded loop.' },
        { stat: '3', text: 'provider invoices to split by hand across five clients, every month.' },
        { stat: '1 card', text: 'yours, behind every client’s usage.' },
      ],
    },
    solution: {
      headline: 'One wallet, a key per client, limits that hold.',
      subheadline:
        'Top up a prepaid wallet. Give each client project a key with a budget. Spend can never exceed the wallet, and never exceed a client’s budget.',
      features: [
        {
          title: 'A budget per client that stops the call',
          body: 'Set a monthly budget and a per-call cap on each client project. A call that would exceed it is refused before it reaches the provider, with a reason your workflow can read.',
          points: ['Budgets and caps checked before the call', 'Spike auto-freeze on one key', 'An email when a client reaches 50, 80 and 100%'],
          demo: <BlockedDemo />,
          wallpaper: 'brown',
        },
        {
          title: 'Invoice from an export',
          body: 'Set a markup per client. At month end, export line items with cost, price and rebill amount and paste them into your invoice.',
          points: ['Report per client for any range', 'CSV ready for your invoicing tool', 'Your markup stays yours'],
          demo: <CsvDemo />,
          wallpaper: 'green',
        },
      ],
      extras: [
        {
          icon: <BanknotesIcon />,
          title: 'Prepaid wallet',
          body: 'Top up from $5. The wallet is the hard ceiling for everything; budgets are the ceiling per client.',
        },
        {
          icon: <KeyIcon />,
          title: 'Offboard in one click',
          body: 'A client leaves, you revoke their key. Nothing else moves.',
        },
        {
          icon: <TerminalIcon />,
          title: 'Set up from Claude Code or Cursor',
          body: 'Install the keyone skill and let your coding agent create the client, mint the key and rewire the code.',
        },
      ],
    },
    steps: [
      { title: 'Sign up and top up', body: 'Create your account, then top up from $5 when you are ready to run.' },
      { title: 'One client, one project, one key', body: 'Dr. Patel Dental → Reminder texts. Set a budget that matches what you quoted.' },
      {
        title: 'Replace the provider key',
        body: 'In the client’s workflow, swap the OpenAI or Anthropic key for the project key. Bill from the export at month end.',
      },
    ],
    productSlugs: ['budgets', 'project-keys', 'client-reports'],
    guideSlug: 'track-ai-costs-per-client',
    faqs: [
      {
        q: 'I only have two clients. Is it worth it?',
        a: 'There is no subscription, so keyone costs nothing until a call runs. Two clients with their own budgets is exactly the point where a shared key starts to hurt.',
      },
      {
        q: 'What does it cost?',
        a: 'Provider price plus 30% on each call, from a prepaid wallet. No monthly fee, no seats. Most freelancers pass the cost through with their own markup on top.',
      },
      {
        q: 'Does it work with n8n, Make and Zapier?',
        a: 'n8n and Make, yes: point the OpenAI or Anthropic credential at keyone and use the project key. Zapier’s OpenAI app takes a key but not a base URL, so those steps stay outside keyone unless you call keyone through a Webhooks step.',
      },
      {
        q: 'Can a client take over later?',
        a: 'Keys belong to your workspace. If a client wants to run their own account, export their history and point their workflow at their own provider credentials. Revoking their key affects only them.',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: 'dev-shops',
    name: 'Dev shops & software agencies',
    audience: 'dev shops and software agencies',
    tagline: 'Shipping AI features inside client codebases',
    icon: <CodeSquareIcon />,
    metaTitle: 'keyone for dev shops and software agencies',
    metaDescription:
      'Ship AI features for clients without a provider account per client. keyone is a drop-in base URL for the OpenAI and Anthropic SDKs, with one key per client project, enforced budgets and per-client cost reports.',
    headline: 'Ship AI features for clients,',
    accent: 'with a budget in the code.',
    subheadline:
      'Change a base URL and a key in the client’s codebase. Every call is attributed to that client and checked against its budget, and the cost report is ready when the sprint invoice is.',
    workspace: {
      owner: 'Your agency',
      clients: [
        { name: 'Harbor Fintech', projects: ['Support copilot', 'Doc extraction'] },
        { name: 'Medix Clinics', projects: ['Intake summaries'] },
        { name: 'Parcel Labs', projects: ['Address parsing'] },
      ],
      tools: TOOLS,
    },
    wallpaper: 'blue',
    problem: {
      headline: 'Every client codebase needs provider access. Whose account is it on?',
      items: [
        {
          icon: <KeyIcon />,
          title: 'A provider account per client, or yours',
          body: 'Either you open OpenAI and Anthropic accounts in each client’s name and chase their card, or you put your agency key in their repo and lose attribution.',
        },
        {
          icon: <CodeSquareIcon />,
          title: 'Staging burns like production',
          body: 'Test suites, agent loops and an afternoon of prompt iteration all bill the same key as the client’s live traffic.',
        },
        {
          icon: <DocumentIcon />,
          title: 'The cost line is missing from the invoice',
          body: 'Hours are tracked. Tokens are not. The AI cost of the sprint is somewhere in a provider invoice that also covers four other clients.',
        },
      ],
    },
    agitate: {
      headline: 'The cheapest line in the proposal is the hardest to invoice.',
      body: 'AI usage is small next to engineering hours, so it gets absorbed. Then a client ships an agent feature, usage grows tenfold, and it is still absorbed because nobody set up attribution on day one.',
      stats: [
        { stat: '10x', text: 'growth in usage the month a client’s agent feature ships, on a key you cannot cap per client.' },
        { stat: '2', text: 'accounts per client, per provider, if you want clean attribution the provider way.' },
        { stat: '1 line', text: 'you cannot put on the invoice: what this client’s AI cost this sprint.' },
      ],
    },
    solution: {
      headline: 'A base URL, a key and a budget per client codebase.',
      subheadline:
        'keyone is a drop-in for the OpenAI and Anthropic SDKs. Point the client’s code at keyone with the project key, and attribution, caps and reporting come with it.',
      features: [
        {
          title: 'Change two lines, keep everything else',
          body: 'Streaming, tools, structured outputs, prompt caching and provider headers pass straight through. The official SDKs, the Vercel AI SDK and LangChain are covered.',
          points: [
            'OpenAI and Anthropic SDK compatible, streaming included',
            'One installer rewires the constructor calls it finds',
            'Each response carries its cost in a header',
          ],
          demo: <ConnectDemo />,
          wallpaper: 'blue',
        },
        {
          title: 'Separate projects for staging and production',
          body: 'Give each environment its own project and budget under the client. Tests cannot eat the production budget, and a loop in staging freezes staging alone.',
          points: ['A project per environment or per feature', 'Allowed models per project', 'Spike auto-freeze per key'],
          demo: <ProjectListDemo />,
          wallpaper: 'green',
        },
        {
          title: 'The AI line on the sprint invoice',
          body: 'Pull a report per client for the billing period and export it. Pass it through at cost or with your markup.',
          points: ['Report per client for any date range', 'CSV with cost, price and rebill amount', 'Bill it, include it or absorb it, knowingly'],
          demo: <ClientReportDemo />,
          wallpaper: 'brown',
        },
      ],
      extras: [
        {
          icon: <TerminalIcon />,
          title: 'Your coding agent can do the setup',
          body: 'Claude Code or Cursor installs the keyone skill, creates the client and project, and rewires the code without the key ever touching the chat.',
        },
        {
          icon: <LockIcon />,
          title: 'Keys hashed, shown once',
          body: 'Project keys are SHA-256 hashed at rest and shown once. Rotate per project, revoke per client.',
        },
        {
          icon: <ChartLineIcon />,
          title: 'A daily spend review',
          body: 'The controller flags premium models on trivial tasks and idle budgets, and proposes the fix. Nothing changes until you click Apply.',
        },
      ],
    },
    steps: [
      {
        title: 'A client, then a project per environment',
        body: 'Harbor Fintech → Support copilot (production), Support copilot (staging). Set a budget on each.',
      },
      {
        title: 'Point the SDK at keyone',
        body: 'Run the keyone installer in the repo, or set the base URL and key by hand. Deploy the same variables to production.',
      },
      { title: 'Invoice the sprint', body: 'Export the client report for the period and add the AI line.' },
    ],
    productSlugs: ['project-keys', 'budgets', 'cost-tracking'],
    guideSlug: 'manage-api-keys-multiple-clients',
    faqs: [
      {
        q: 'Which SDKs and frameworks work?',
        a: 'The official OpenAI and Anthropic SDKs, the Vercel AI SDK and LangChain are tested against keyone every day. Anything that lets you set a base URL and an API key works.',
      },
      {
        q: 'What about Gemini and other models?',
        a: 'OpenAI, Anthropic and Perplexity today. Gemini models are reachable through Perplexity’s Agent API, and direct Gemini is next on the catalog list.',
      },
      {
        q: 'Can the client take over the integration later?',
        a: 'Yes. Keep the base URL and key in environment variables. Hand over by swapping them for the client’s own provider credentials; the code does not change.',
      },
      {
        q: 'Who owns the provider relationship?',
        a: 'keyone does. Your agency funds one wallet and every client project draws on it. If a client must have their own provider account and direct billing, keep that client outside keyone.',
      },
    ],
  },
]

export function getUseCase(slug: string): UseCaseContent | undefined {
  return useCases.find(u => u.slug === slug)
}
