import { clsx } from 'clsx/lite'

/* Product visuals rendered in HTML, shown inside the kit's <Screenshot> frames. */

function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={clsx('overflow-hidden bg-white text-sm/6 text-olive-950 dark:bg-olive-900 dark:text-white', className)}>
      {children}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs/5 font-medium tracking-wide text-olive-500 uppercase">{children}</p>
}

/* ------------------------------------------------------------------ */
/* Hero: the agency's view of every client, budgets, a blocked call    */
/* ------------------------------------------------------------------ */

const heroClients = [
  { name: 'Durand Construction', projects: 3, spent: 122.5, budget: 180 },
  { name: 'Moreau Charpente', projects: 4, spent: 211.8, budget: 240 },
  { name: 'Batiplus', projects: 2, spent: 64.1, budget: 150 },
  { name: 'Atelier Lefèvre', projects: 1, spent: 8.95, budget: 50 },
]

export function HeroDemo() {
  return (
    <Panel>
      <div className="flex items-center justify-between gap-6 border-b border-olive-950/10 px-6 py-5 dark:border-white/10">
        <div>
          <Label>Your agency</Label>
          <p className="font-display text-2xl/8 sm:text-3xl/9">12 clients · 1 account</p>
        </div>
        <div className="text-right">
          <Label>This month</Label>
          <p className="font-display text-2xl/8 sm:text-3xl/9">$407.35</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_20rem]">
        <ul className="divide-y divide-olive-950/10 dark:divide-white/10">
          {heroClients.map(c => {
            const pct = Math.min(100, Math.round((c.spent / c.budget) * 100))
            const plural = c.projects === 1 ? '' : 's'
            return (
              <li key={c.name} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.name}</p>
                    <p className="text-xs/5 text-olive-500">
                      {c.projects} project{plural} · {c.projects} key{plural}
                    </p>
                  </div>
                  <p className="text-sm whitespace-nowrap text-olive-700 dark:text-olive-300">
                    ${c.spent.toFixed(2)} <span className="text-olive-400">/ ${c.budget}</span>
                  </p>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-olive-950/10 dark:bg-white/10">
                  <div
                    className={clsx('h-full rounded-full', pct >= 85 ? 'bg-amber-500' : 'bg-brand-lime')}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
        <div className="border-olive-950/10 p-4 max-lg:border-t sm:p-6 lg:border-l dark:border-white/10">
          <Label>Latest event</Label>
          <div className="mt-3 rounded-md bg-olive-950/2.5 p-4 dark:bg-white/5">
            <div className="flex items-center gap-2">
              <span className="rounded-sm bg-red-100 px-1.5 py-0.5 font-mono text-xs/5 text-red-700 dark:bg-red-500/15 dark:text-red-300">
                403 BLOCKED
              </span>
              <span className="text-xs/5 text-olive-500">2:14 AM</span>
            </div>
            <p className="mt-2 text-sm/6 text-olive-700 dark:text-olive-300">
              A loop in <span className="text-olive-950 dark:text-white">Moreau Charpente · Site reports</span> hit its
              budget. Stopped, nothing charged past the limit.
            </p>
          </div>
        </div>
      </div>
    </Panel>
  )
}

/* ------------------------------------------------------------------ */
/* Problem: keys multiply with every client and every tool             */
/* ------------------------------------------------------------------ */

const sprawlProviders = ['OpenAI', 'Anthropic', 'Perplexity', 'Apify']
const sprawlClients = [
  { name: 'Durand', where: ['.env', 'n8n', 'Make', '.env'] },
  { name: 'Moreau', where: ['n8n', 'n8n', '—', 'Make'] },
  { name: 'Batiplus', where: ['Make', '.env', 'n8n', '—'] },
  { name: 'Lefèvre', where: ['.env', '—', '.env', 'n8n'] },
]

export function KeySprawlDemo() {
  return (
    <Panel>
      <div className="flex items-center justify-between border-b border-olive-950/10 px-6 py-4 dark:border-white/10">
        <p className="font-medium">Your API keys today</p>
        <p className="text-xs/5 text-red-700 dark:text-red-300">clients × tools</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs/5">
          <thead>
            <tr className="text-olive-500">
              <th className="px-6 py-3 text-left font-medium">Client</th>
              {sprawlProviders.map(p => (
                <th key={p} className="px-2 py-3 text-left font-medium">
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sprawlClients.map(c => (
              <tr key={c.name} className="border-t border-olive-950/10 dark:border-white/10">
                <td className="px-6 py-3">{c.name}</td>
                {c.where.map((w, i) =>
                  w === '—' ? (
                    <td key={i} className="px-2 py-3 text-olive-400">
                      —
                    </td>
                  ) : (
                    <td key={i} className="px-2 py-3">
                      <span className="inline-flex items-center gap-1 rounded-sm bg-olive-950/5 px-1.5 py-0.5 font-mono whitespace-nowrap text-olive-700 dark:bg-white/10 dark:text-olive-300">
                        sk-…{(c.name.charCodeAt(0) * (i + 3)).toString(16).slice(-3)}
                        <span className="text-olive-400">· {w}</span>
                      </span>
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-olive-950/10 bg-olive-950/2.5 px-6 py-3 text-xs/5 dark:border-white/10 dark:bg-white/5">
        <p className="text-olive-500">+ 8 more clients</p>
        <p>≈ 40 keys, 4 bills, 0 budgets per client</p>
      </div>
    </Panel>
  )
}

/* ------------------------------------------------------------------ */
/* Solution: agency → clients → project keys → every tool              */
/* ------------------------------------------------------------------ */

const structureClients = [
  { name: 'Durand Construction', projects: ['Quote generator', 'Site report summarizer'] },
  { name: 'Batiplus', projects: ['Tender scraper', 'Email assistant'] },
]

export function StructureDemo({ tools }: { tools: string[] }) {
  return (
    <Panel className="grid items-center gap-6 p-6 sm:p-8 lg:grid-cols-[auto_1fr_auto] lg:gap-8">
      <div className="rounded-md bg-olive-950/2.5 px-5 py-4 dark:bg-white/5">
        <Label>Agency</Label>
        <p className="font-display text-2xl/8">Your agency</p>
        <p className="text-xs/5 text-olive-500">One wallet</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {structureClients.map(c => (
          <div key={c.name} className="rounded-md bg-olive-950/2.5 p-4 dark:bg-white/5">
            <Label>Client</Label>
            <p className="mb-3 font-medium">{c.name}</p>
            <div className="flex flex-col gap-2">
              {c.projects.map(p => (
                <div
                  key={p}
                  className="flex items-center justify-between gap-3 rounded-sm bg-white px-3 py-2 ring-1 ring-olive-950/10 dark:bg-olive-950 dark:ring-white/10"
                >
                  <span className="truncate">{p}</span>
                  <span className="font-mono text-xs/5 whitespace-nowrap text-brand-green dark:text-brand-lime">
                    kone_live_…
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-md bg-olive-950/2.5 px-5 py-4 dark:bg-white/5">
        <Label>Every tool</Label>
        <ul className="mt-2 flex flex-col gap-1 text-olive-700 dark:text-olive-300">
          {tools.slice(0, 4).map(t => (
            <li key={t}>{t}</li>
          ))}
          <li className="text-olive-400">+ more</li>
        </ul>
      </div>
    </Panel>
  )
}

/* ------------------------------------------------------------------ */
/* Core features                                                       */
/* ------------------------------------------------------------------ */

export function KeysDemo() {
  return (
    <div className="overflow-x-auto bg-olive-950 p-6 sm:p-8">
      <pre className="font-mono text-xs/6 text-[#c0dd97] sm:text-sm/7">{`from openai import OpenAI
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

export function SpendDemo() {
  return (
    <Panel>
      <div className="flex items-center justify-between border-b border-olive-950/10 px-6 py-4 dark:border-white/10">
        <p className="font-medium">Spend by client</p>
        <p className="text-xs/5 text-olive-500">September</p>
      </div>
      <table className="w-full">
        <thead>
          <tr className="text-xs/5 text-olive-500">
            <th className="px-6 py-3 text-left font-medium">Client</th>
            <th className="hidden px-3 py-3 text-right font-medium sm:table-cell">Projects</th>
            <th className="px-3 py-3 text-right font-medium">Cost</th>
            <th className="px-6 py-3 text-right font-medium">Rebill</th>
          </tr>
        </thead>
        <tbody>
          {spendRows.map(r => (
            <tr key={r.client} className="border-t border-olive-950/10 dark:border-white/10">
              <td className="px-6 py-3">{r.client}</td>
              <td className="hidden px-3 py-3 text-right text-olive-500 sm:table-cell">{r.projects}</td>
              <td className="px-3 py-3 text-right text-olive-700 dark:text-olive-300">{r.spend}</td>
              <td className="px-6 py-3 text-right font-medium text-brand-green dark:text-brand-lime">{r.rebill}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between border-t border-olive-950/10 bg-olive-950/2.5 px-6 py-3 text-xs/5 dark:border-white/10 dark:bg-white/5">
        <p className="text-olive-500">Markup 30% · 10 projects</p>
        <p>Export CSV →</p>
      </div>
    </Panel>
  )
}
