import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'key.one — Stop managing API keys for every client',
  description:
    'For AI automation agencies: replace the dozens of provider keys you manage across clients with one account and one key per client project, with spend tracked and capped per client.',
}

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-2xs text-green-dark uppercase tracking-widest font-medium mb-3">{children}</p>
}

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-[3px] text-green-dark" aria-hidden>
      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Cross() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-[3px] text-[#A32D2D]" aria-hidden>
      <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function Section({ id, className = '', children }: { id?: string; className?: string; children: React.ReactNode }) {
  return (
    <section id={id} className={`px-6 md:px-10 py-20 md:py-28 scroll-mt-16 ${className}`}>
      <div className="max-w-6xl mx-auto">{children}</div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Hero mockup: the agency's view of every client, budgets, a block    */
/* ------------------------------------------------------------------ */

const heroClients = [
  { name: 'Durand Construction', projects: 3, spent: 122.5, budget: 180 },
  { name: 'Moreau Charpente', projects: 4, spent: 211.8, budget: 240 },
  { name: 'Batiplus', projects: 2, spent: 64.1, budget: 150 },
  { name: 'Atelier Lefèvre', projects: 1, spent: 8.95, budget: 50 },
]

function HeroMockup() {
  return (
    <div className="relative">
      <div className="card shadow-[0_24px_60px_-30px_rgba(26,26,24,0.25)] overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b border-half border-border">
          <div>
            <p className="text-2xs text-ink-subtle uppercase tracking-widest">Your agency</p>
            <p className="serif text-2xl leading-tight">12 clients · 1 account</p>
          </div>
          <div className="text-right">
            <p className="text-2xs text-ink-subtle uppercase tracking-widest">This month</p>
            <p className="serif text-2xl leading-tight">$407.35</p>
          </div>
        </div>
        <ul>
          {heroClients.map(c => {
            const pct = Math.min(100, Math.round((c.spent / c.budget) * 100))
            return (
              <li key={c.name} className="px-5 py-3.5 border-b border-half border-border last:border-b-0">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm text-ink truncate">{c.name}</p>
                    <p className="text-2xs text-ink-subtle">
                      {c.projects} {c.projects === 1 ? 'project' : 'projects'} · {c.projects} {c.projects === 1 ? 'key' : 'keys'}
                    </p>
                  </div>
                  <p className="text-xs text-ink-muted whitespace-nowrap">
                    ${c.spent.toFixed(2)} <span className="text-ink-subtle">/ ${c.budget}</span>
                  </p>
                </div>
                <div className="mt-2 h-1 rounded-full bg-border/70 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${pct >= 85 ? 'bg-[#C98A1B]' : 'bg-green-mid'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Blocked call toast */}
      <div className="card absolute -bottom-20 -left-2 md:-left-10 w-[290px] p-4 shadow-[0_16px_40px_-20px_rgba(26,26,24,0.3)]">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="inline-block text-2xs font-mono px-1.5 py-0.5 rounded bg-[#FCEBEB] text-[#A32D2D]">403 BLOCKED</span>
          <span className="text-2xs text-ink-subtle">2:14 AM</span>
        </div>
        <p className="text-xs text-ink-muted leading-snug">
          A loop in <span className="text-ink">Moreau Charpente · Site reports</span> hit its budget. Stopped, nothing charged past the limit.
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Problem visual: keys multiply with every client and every tool      */
/* ------------------------------------------------------------------ */

const sprawlProviders = ['OpenAI', 'Anthropic', 'Perplexity', 'Apify']
const sprawlClients = [
  { name: 'Durand', where: ['.env', 'n8n', 'Make', '.env'] },
  { name: 'Moreau', where: ['n8n', 'n8n', '—', 'Make'] },
  { name: 'Batiplus', where: ['Make', '.env', 'n8n', '—'] },
  { name: 'Lefèvre', where: ['.env', '—', '.env', 'n8n'] },
]

function KeySprawl() {
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3.5 flex items-center justify-between border-b border-half border-border">
        <p className="text-sm text-ink">Your API keys today</p>
        <p className="text-xs text-[#A32D2D]">clients × tools</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-2xs text-ink-subtle uppercase tracking-widest">
              <th className="text-left font-medium px-5 py-2.5">Client</th>
              {sprawlProviders.map(p => (
                <th key={p} className="text-left font-medium px-2 py-2.5">{p}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sprawlClients.map(c => (
              <tr key={c.name} className="border-t border-half border-border">
                <td className="px-5 py-2.5 text-ink">{c.name}</td>
                {c.where.map((w, i) =>
                  w === '—' ? (
                    <td key={i} className="px-2 py-2.5 text-ink-subtle">—</td>
                  ) : (
                    <td key={i} className="px-2 py-2.5">
                      <span className="inline-flex items-center gap-1 font-mono text-2xs px-1.5 py-0.5 rounded bg-bg border border-half border-border text-ink-muted whitespace-nowrap">
                        sk-…{(c.name.charCodeAt(0) * (i + 3)).toString(16).slice(-3)}
                        <span className="text-ink-subtle">· {w}</span>
                      </span>
                    </td>
                  )
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-3 border-t border-half border-border bg-bg flex items-center justify-between">
        <p className="text-xs text-ink-muted">+ 8 more clients</p>
        <p className="text-xs text-ink">≈ 40 keys, 4 bills, 0 budgets per client</p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

const problems = [
  {
    title: 'A key for every tool, for every client',
    body: 'Each new client means a new OpenAI key, a new Anthropic key, a new Perplexity key, scattered across .env files, n8n credentials and Make connections. You manage all of them.',
  },
  {
    title: 'One bill, many clients',
    body: 'Every provider bills your agency for all your clients at once. Splitting it per client means spreadsheets, guesses, and a lost afternoon every month.',
  },
  {
    title: 'No brakes per client',
    body: 'Provider limits apply to your whole account, not to one client. A single runaway loop can burn through a client’s budget before anyone looks.',
  },
]

const agitations = [
  { stat: '$400', text: 'burned overnight by one retry loop, on a client paying you a $300 retainer.' },
  { stat: '40+', text: 'keys to create, store, rotate and revoke once you run four tools for ten clients.' },
  { stat: '5', text: 'provider dashboards to open when a client asks what their AI actually cost.' },
]

const coreFeatures = [
  {
    eyebrow: 'Key management',
    benefit: 'Replace dozens of provider keys with one per client project.',
    body: 'Your agency stops managing a key per tool per client. Each client project gets one key that works across the whole catalog. Add Perplexity to a client’s workflow next week and nothing changes.',
    points: [
      'No provider accounts, cards or keys to set up for each client',
      'Onboard a client in a minute: create the project, copy the key',
      'Offboard a client, or rotate a leaked key, without touching anyone else',
      'Drop-in for the OpenAI and Anthropic SDKs: change the base URL and the key',
    ],
    visual: 'keys' as const,
  },
  {
    eyebrow: 'Spend management',
    benefit: 'Know what every client costs your agency, to the cent.',
    body: 'Every call is stamped with its client, project, tool, and model the moment it happens. No tagging, no month-end reconciliation.',
    points: [
      'Live spend per client, per project, per model',
      'Monthly budgets per client and per project',
      'Per-call caps and allowed tools and models, checked before the call runs',
      'Blocked calls return a clear reason your agent can read and explain',
    ],
    visual: 'spend' as const,
  },
]

const moreFeatures = [
  {
    benefit: 'Sleep through the 2 AM loop',
    feature: 'Spike auto-freeze',
    body: 'When one client’s key suddenly spends many times its normal hourly rate, key.one freezes that key alone. Every other client keeps running.',
    icon: 'M8 1.5v3M8 11.5v3M3.4 3.4l2.1 2.1M10.5 10.5l2.1 2.1M1.5 8h3M11.5 8h3M3.4 12.6l2.1-2.1M10.5 5.5l2.1-2.1',
  },
  {
    benefit: 'Hear about it before the client does',
    feature: 'Budget alerts',
    body: 'An email and a webhook at 50, 80 and 100% of every client and project budget. Once per threshold, not a flood.',
    icon: 'M8 2a4 4 0 014 4v2.5l1.5 2.5h-11L4 8.5V6a4 4 0 014-4zM6.5 13a1.5 1.5 0 003 0',
  },
  {
    benefit: 'Say yes in one click',
    feature: 'Budget requests',
    body: 'When an agent needs more room it asks for it, with a reason. You approve or deny from the email. Small increases can approve themselves.',
    icon: 'M3 8.5l3 3 7-7',
  },
  {
    benefit: 'Rebill with confidence, and keep your margin',
    feature: 'Client reports and CSV export',
    body: 'Set a markup per client and export line items ready to invoice. Cost, price, and rebill amount in every row.',
    icon: 'M3 2.5h7l3 3v8H3zM10 2.5v3h3M5.5 8.5h5M5.5 11h3.5',
  },
  {
    benefit: 'A FinOps reviewer you’d never hire',
    feature: 'Controller agent',
    body: 'Every morning it reviews spend, flags drift, premium models on trivial tasks, and idle budgets, and proposes the fix. Nothing changes until you click Apply.',
    icon: 'M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM8 4.5V8l2.5 1.5',
  },
  {
    benefit: 'Let your agents set themselves up',
    feature: 'MCP server and skill file',
    body: 'Claude Code, Cursor, or your own agent can create clients, mint project keys, and check spend through MCP. You stay in control of the limits.',
    icon: 'M5 4.5L1.5 8 5 11.5M11 4.5L14.5 8 11 11.5M9.5 2.5l-3 11',
  },
  {
    benefit: 'One wallet instead of five invoices',
    feature: 'Prepaid wallet',
    body: 'Top up once and spend across every provider, for every client. No card on file with each vendor, no surprise overage at month end.',
    icon: 'M1.5 4.5h13v9h-13zM1.5 7.5h13M11 10.5h1',
  },
  {
    benefit: 'Nothing to rebuild',
    feature: 'Streaming and SDK compatible',
    body: 'Streaming, tools, and provider headers pass straight through. Your existing code keeps working, now with a budget around it.',
    icon: 'M2 5h9M2 8h12M2 11h7',
  },
]

const steps = [
  {
    n: '01',
    title: 'Add a client and a project',
    body: 'Mirror how you already work: Durand Construction → Quote generator. Set a monthly budget if you want one.',
  },
  {
    n: '02',
    title: 'Swap out the provider keys',
    body: 'In that client’s automations, replace the OpenAI, Anthropic and other keys with the one project key. Every tool in the catalog now runs on it.',
  },
  {
    n: '03',
    title: 'Run, watch, rebill',
    body: 'Spend lands on the right client in real time. At month end, export the CSV and send the invoice.',
  },
]

const catalog = ['OpenAI', 'Anthropic', 'Perplexity', 'Google Maps via Apify', 'DataForSEO']

const faqs = [
  {
    q: 'Do I still need provider accounts for each client?',
    a: 'No. key.one holds the provider access. Your agency has one account and one wallet, and every client project key can use every tool in the catalog.',
  },
  {
    q: 'What happens when a budget is reached?',
    a: 'The call is refused before it reaches the provider, with a 403 and a machine-readable reason: which limit, how much was spent, and when it resets. Nothing is charged past the limit.',
  },
  {
    q: 'Will it break my existing automations?',
    a: 'Change the base URL and the key in your OpenAI or Anthropic SDK. Streaming, tools, and provider headers pass through unchanged.',
  },
  {
    q: 'Do my clients see or manage anything?',
    a: 'No. key.one is for your agency. Keys live in your automations, and your clients just get an accurate invoice from you.',
  },
  {
    q: 'How is usage priced?',
    a: 'You pay as you go from a prepaid wallet, per token or per result depending on the tool. Every response tells you exactly what that call cost.',
  },
]

/* ------------------------------------------------------------------ */
/* Feature visuals                                                     */
/* ------------------------------------------------------------------ */

function KeysVisual() {
  return (
    <div className="code-block">
      <pre>{`from openai import OpenAI
from anthropic import Anthropic

client = OpenAI(
    base_url="https://key.one/api/proxy/openai/v1",
    api_key="kone_live_7f3a…",  # Durand · Quote generator
)

# Same key, another tool: no new account, no new secret
anthropic = Anthropic(
    base_url="https://key.one/api/proxy/anthropic",
    api_key="kone_live_7f3a…",
)`}</pre>
    </div>
  )
}

const spendRows = [
  { client: 'Durand Construction', projects: 3, spend: '$122.50', rebill: '$159.25' },
  { client: 'Batiplus', projects: 2, spend: '$64.10', rebill: '$83.33' },
  { client: 'Moreau Charpente', projects: 4, spend: '$211.80', rebill: '$275.34' },
  { client: 'Atelier Lefèvre', projects: 1, spend: '$8.95', rebill: '$11.64' },
]

function SpendVisual() {
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3.5 flex items-center justify-between border-b border-half border-border">
        <p className="text-sm text-ink">Spend by client</p>
        <p className="text-xs text-ink-subtle">September</p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-2xs text-ink-subtle uppercase tracking-widest">
            <th className="text-left font-medium px-5 py-2.5">Client</th>
            <th className="text-right font-medium px-3 py-2.5 hidden sm:table-cell">Projects</th>
            <th className="text-right font-medium px-3 py-2.5">Cost</th>
            <th className="text-right font-medium px-5 py-2.5">Rebill</th>
          </tr>
        </thead>
        <tbody>
          {spendRows.map(r => (
            <tr key={r.client} className="border-t border-half border-border">
              <td className="px-5 py-3 text-ink">{r.client}</td>
              <td className="px-3 py-3 text-right text-ink-muted hidden sm:table-cell">{r.projects}</td>
              <td className="px-3 py-3 text-right text-ink-muted">{r.spend}</td>
              <td className="px-5 py-3 text-right text-green-dark font-medium">{r.rebill}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-5 py-3 border-t border-half border-border flex items-center justify-between bg-bg">
        <p className="text-xs text-ink-muted">Markup 30% · 10 projects</p>
        <p className="text-xs text-ink">Export CSV →</p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function HomePage() {
  return (
    <div className="bg-bg text-ink overflow-x-hidden">
      {/* Nav */}
      <header className="sticky top-0 z-40 bg-bg/85 backdrop-blur border-b border-half border-border">
        <div className="max-w-6xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <Link href="/" className="logo text-2xl">
            key<span className="dot">.</span>one
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-ink-muted">
            <a href="#features" className="hover:text-ink transition-colors">Features</a>
            <a href="#how" className="hover:text-ink transition-colors">How it works</a>
            <a href="#faq" className="hover:text-ink transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm text-ink-muted hover:text-ink px-3 py-2 transition-colors">
              Sign in
            </Link>
            <Link href="/signup" className="btn-primary !py-2 !px-4 text-sm">
              Start free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 md:px-10 pt-16 md:pt-24 pb-24 md:pb-32">
        <div className="max-w-6xl mx-auto grid md:grid-cols-[1.05fr_1fr] gap-16 md:gap-12 items-center">
          <div>
            <span className="badge mb-6">For AI automation agencies</span>
            <h1 className="serif text-5xl md:text-6xl font-normal mt-5 mb-6">
              Stop managing API keys for every client.
              <br />
              <span className="italic text-green-dark">Know what each one costs you.</span>
            </h1>
            <p className="text-lg text-ink-muted max-w-xl mb-8">
              Your agency runs AI for a dozen clients, on a handful of tools, with a key for every combination. key.one
              replaces them with one account and one key per client project, then tracks and caps the spend per client.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/signup" className="btn-primary !px-6 !py-3 text-md">
                Start free
              </Link>
              <a href="#how" className="btn-secondary !px-6 !py-3 text-md">
                See how it works
              </a>
            </div>
            <p className="text-xs text-ink-subtle mt-4">No provider accounts needed. Set up your first client in minutes.</p>
          </div>
          <div className="md:pl-6">
            <HeroMockup />
          </div>
        </div>
      </section>

      {/* Problem */}
      <Section className="bg-cream border-y border-half border-border">
        <div className="max-w-2xl mb-12">
          <Eyebrow>The problem</Eyebrow>
          <h2 className="serif text-4xl md:text-5xl font-normal">
            Ten clients in, your agency is managing a key for every tool, for every client.
          </h2>
        </div>
        <div className="grid lg:grid-cols-[1fr_1.15fr] gap-10 items-start">
          <div className="flex flex-col gap-4">
            {problems.map(p => (
              <div key={p.title} className="card-bg p-6">
                <div className="flex items-start gap-2.5 mb-2">
                  <Cross />
                  <h3 className="text-lg font-medium">{p.title}</h3>
                </div>
                <p className="text-base text-ink-muted">{p.body}</p>
              </div>
            ))}
          </div>
          <KeySprawl />
        </div>
      </Section>

      {/* Agitate */}
      <Section>
        <div className="grid md:grid-cols-[1fr_1.2fr] gap-12 md:gap-20 items-start">
          <div>
            <Eyebrow>And it gets worse as you grow</Eyebrow>
            <h2 className="serif text-4xl md:text-5xl font-normal mb-6">Every new client multiplies the risk.</h2>
            <p className="text-lg text-ink-muted">
              Every client you sign adds a key per tool to your pile, more workflows that can loop, and more cost you
              can’t attribute. You end up absorbing the overages, because you can’t prove which client caused them.
            </p>
          </div>
          <div className="flex flex-col">
            {agitations.map(a => (
              <div key={a.stat} className="flex items-baseline gap-6 py-6 border-b border-half border-border first:pt-0 last:border-b-0">
                <p className="serif text-5xl md:text-6xl text-ink w-28 shrink-0">{a.stat}</p>
                <p className="text-lg text-ink-muted">{a.text}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Solution */}
      <section className="px-6 md:px-10 py-20 md:py-28 bg-ink text-bg">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mb-14">
            <p className="text-2xs text-green-light uppercase tracking-widest font-medium mb-3">The solution</p>
            <h2 className="serif text-4xl md:text-5xl font-normal mb-6">
              One account for your agency. One key per client project. Every tool behind it.
            </h2>
            <p className="text-lg text-[#B4B2A9]">
              key.one sits between your automations and the AI providers. You organize it by client and project, the way
              you already work, and every call is attributed to the right client and checked against its limits.
            </p>
          </div>

          {/* Structure diagram */}
          <div className="grid md:grid-cols-[auto_1fr_auto] gap-6 md:gap-10 items-center">
            <div className="rounded-lg border border-half border-[#444441] px-5 py-4">
              <p className="text-2xs text-[#888780] uppercase tracking-widest mb-1">Agency</p>
              <p className="serif text-2xl">Your agency</p>
              <p className="text-xs text-[#888780] mt-1">One wallet</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { c: 'Durand Construction', ps: ['Quote generator', 'Site report summarizer'] },
                { c: 'Batiplus', ps: ['Tender scraper', 'Email assistant'] },
              ].map(x => (
                <div key={x.c} className="rounded-lg border border-half border-[#444441] p-4">
                  <p className="text-2xs text-[#888780] uppercase tracking-widest mb-1">Client</p>
                  <p className="text-md mb-3">{x.c}</p>
                  <div className="flex flex-col gap-2">
                    {x.ps.map(p => (
                      <div key={p} className="flex items-center justify-between gap-3 rounded bg-[#2C2C2A] px-3 py-2">
                        <span className="text-sm truncate">{p}</span>
                        <span className="text-2xs font-mono text-green-light whitespace-nowrap">kone_live_…</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-half border-[#444441] px-5 py-4">
              <p className="text-2xs text-[#888780] uppercase tracking-widest mb-2">Every tool</p>
              <ul className="text-sm flex flex-col gap-1 text-[#D3D1C7]">
                {catalog.slice(0, 4).map(c => <li key={c}>{c}</li>)}
                <li className="text-[#888780]">+ more</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Core features */}
      <Section id="features">
        <div className="max-w-2xl mb-16">
          <Eyebrow>The core</Eyebrow>
          <h2 className="serif text-4xl md:text-5xl font-normal">
            Keys and spend, handled.
          </h2>
        </div>
        <div className="flex flex-col gap-24">
          {coreFeatures.map((f, i) => (
            <div key={f.eyebrow} className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
              <div className={i % 2 === 1 ? 'md:order-2' : ''}>
                <Eyebrow>{f.eyebrow}</Eyebrow>
                <h3 className="serif text-3xl md:text-4xl font-normal mb-4">{f.benefit}</h3>
                <p className="text-lg text-ink-muted mb-6">{f.body}</p>
                <ul className="flex flex-col gap-2.5">
                  {f.points.map(p => (
                    <li key={p} className="flex items-start gap-2.5 text-base text-ink">
                      <Check />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={i % 2 === 1 ? 'md:order-1' : ''}>
                {f.visual === 'keys' ? <KeysVisual /> : <SpendVisual />}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* More features */}
      <Section className="bg-cream border-y border-half border-border">
        <div className="max-w-2xl mb-12">
          <Eyebrow>Everything around it</Eyebrow>
          <h2 className="serif text-4xl md:text-5xl font-normal">
            Built for agencies running AI for other people’s businesses.
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {moreFeatures.map(f => (
            <div key={f.feature} className="card-bg p-6 flex flex-col">
              <div className="w-9 h-9 rounded-full bg-green-pale text-green-dark flex items-center justify-center mb-5">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d={f.icon} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="serif text-2xl font-normal mb-1">{f.benefit}</h3>
              <p className="text-2xs text-ink-subtle uppercase tracking-widest mb-3">{f.feature}</p>
              <p className="text-base text-ink-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Testimonial */}
      <Section>
        <figure className="max-w-4xl mx-auto text-center">
          <svg width="36" height="28" viewBox="0 0 36 28" fill="none" className="mx-auto mb-8 text-green-mid" aria-hidden>
            <path
              d="M0 28V17.2C0 7.6 4.9 1.9 14.6 0l1.6 3.9C10.6 5.6 7.9 8.9 7.6 13.6H14V28H0zm20 0V17.2C20 7.6 24.9 1.9 34.6 0l1.4 3.9c-5.6 1.7-8.3 5-8.6 9.7H34V28H20z"
              fill="currentColor"
            />
          </svg>
          <blockquote className="serif text-3xl md:text-4xl font-normal leading-snug mb-10">
            “We run automations for a dozen construction companies, and I was managing a separate set of API keys for
            each of them, then rebuilding the AI bill by hand every month. Now it’s one account, one key per client
            project with a budget, and invoicing is an export.”
          </blockquote>
          <figcaption className="flex items-center justify-center gap-4">
            <Image
              src="/clement.jpg"
              alt="Clement Bernard"
              width={56}
              height={56}
              className="rounded-full object-cover w-14 h-14"
            />
            <div className="text-left">
              <p className="text-md text-ink">Clement Bernard</p>
              <p className="text-sm text-ink-muted">
                Founder,{' '}
                <a href="https://visionbds.com" target="_blank" rel="noopener noreferrer" className="underline decoration-border underline-offset-4 hover:decoration-ink-muted">
                  Visionbds
                </a>
                <span className="text-ink-subtle"> · AI automation for construction</span>
              </p>
            </div>
          </figcaption>
        </figure>
      </Section>

      {/* How it works */}
      <Section id="how" className="bg-cream border-y border-half border-border">
        <div className="max-w-2xl mb-12">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="serif text-4xl md:text-5xl font-normal">Live in an afternoon.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5 mb-14">
          {steps.map(s => (
            <div key={s.n} className="card-bg p-6">
              <p className="serif text-4xl text-green-dark mb-4">{s.n}</p>
              <h3 className="text-lg font-medium mb-2">{s.title}</h3>
              <p className="text-base text-ink-muted">{s.body}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="text-2xs text-ink-subtle uppercase tracking-widest font-medium mb-4">In the catalog today</p>
          <div className="flex flex-wrap gap-2">
            {catalog.map(c => (
              <span key={c} className="text-sm text-ink px-3.5 py-1.5 rounded-full bg-bg border border-half border-border">
                {c}
              </span>
            ))}
            <span className="text-sm text-ink-subtle px-3.5 py-1.5">More tools every month</span>
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq">
        <div className="grid md:grid-cols-[1fr_1.6fr] gap-12">
          <div>
            <Eyebrow>FAQ</Eyebrow>
            <h2 className="serif text-4xl md:text-5xl font-normal">Questions agencies ask.</h2>
          </div>
          <div className="flex flex-col">
            {faqs.map(f => (
              <details key={f.q} className="group py-5 border-b border-half border-border first:pt-0">
                <summary className="flex items-center justify-between gap-6 cursor-pointer list-none text-lg text-ink">
                  {f.q}
                  <span className="text-ink-subtle text-xl leading-none transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="text-base text-ink-muted mt-3 pr-10">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </Section>

      {/* Final CTA */}
      <section className="px-6 md:px-10 pb-24">
        <div className="max-w-6xl mx-auto rounded-xl bg-ink text-bg px-8 py-16 md:py-20 text-center">
          <h2 className="serif text-4xl md:text-5xl font-normal mb-4">
            Fewer keys to manage.
            <br />
            <span className="italic text-green-light">Every client’s AI spend under control.</span>
          </h2>
          <p className="text-lg text-[#B4B2A9] max-w-xl mx-auto mb-8">
            Set up your first client and project in minutes. Your automations keep running, now with budgets and a clean
            invoice at the end of the month.
          </p>
          <Link href="/signup" className="btn-green !px-7 !py-3 text-md">
            Start free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-10 py-10 border-t border-half border-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="logo text-xl">
            key<span className="dot">.</span>one
          </Link>
          <p className="text-xs text-ink-subtle">API keys and AI spend for agencies, organized by client.</p>
          <div className="flex items-center gap-5 text-sm text-ink-muted">
            <Link href="/login" className="hover:text-ink transition-colors">Sign in</Link>
            <Link href="/signup" className="hover:text-ink transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
