import { clsx } from 'clsx/lite'

/*
 * Product visuals for the product pages: HTML recreations of the real dashboard
 * screens (overview, client report, project page, reports, spend review) with
 * sample data, shown inside the kit's <Screenshot> frames.
 */

const line = 'border-olive-950/10 dark:border-white/10'
const muted = 'text-olive-500'
const soft = 'text-olive-700 dark:text-olive-300'

function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={clsx('overflow-hidden bg-white text-sm/6 text-olive-950 dark:bg-olive-900 dark:text-white', className)}>
      {children}
    </div>
  )
}

function Stat({ label, value, note, tone }: { label: string; value: string; note?: string; tone?: 'green' | 'red' }) {
  return (
    <div className="rounded-md bg-olive-950/2.5 px-4 py-3 dark:bg-white/5">
      <p className={clsx('text-xs/5', muted)}>{label}</p>
      <p
        className={clsx(
          'font-display text-2xl/8',
          tone === 'green' && 'text-brand-green dark:text-brand-lime',
          tone === 'red' && 'text-red-700 dark:text-red-300',
        )}
      >
        {value}
      </p>
      {note && <p className={clsx('text-xs/5', muted)}>{note}</p>}
    </div>
  )
}

function Badge({ tone = 'neutral', children }: { tone?: 'neutral' | 'green' | 'red' | 'amber'; children: React.ReactNode }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-sm px-1.5 py-0.5 font-mono text-xs/5 whitespace-nowrap',
        tone === 'neutral' && 'bg-olive-950/5 text-olive-700 dark:bg-white/10 dark:text-olive-300',
        tone === 'green' && 'bg-brand-lime/20 text-brand-green dark:bg-brand-lime/15 dark:text-brand-lime',
        tone === 'red' && 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
        tone === 'amber' && 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300',
      )}
    >
      {children}
    </span>
  )
}

function Bar({ pct, tone = 'green' }: { pct: number; tone?: 'green' | 'amber' | 'red' }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-olive-950/10 dark:bg-white/10">
      <div
        className={clsx(
          'h-full rounded-full',
          tone === 'green' && 'bg-brand-lime',
          tone === 'amber' && 'bg-amber-500',
          tone === 'red' && 'bg-red-500',
        )}
        style={{ width: `${Math.min(100, pct)}%` }}
      />
    </div>
  )
}

function PanelHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className={clsx('flex items-center justify-between gap-4 border-b px-5 py-3.5', line)}>
      <p className="font-medium">{title}</p>
      {right && <div className={clsx('text-xs/5', muted)}>{right}</div>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Cost tracking                                                       */
/* ------------------------------------------------------------------ */

const spendClients = [
  { name: 'Durand Construction', projects: 3, spent: 122.5, budget: 180 },
  { name: 'Moreau Charpente', projects: 4, spent: 211.8, budget: 240 },
  { name: 'Batiplus', projects: 2, spent: 64.1, budget: 150 },
  { name: 'Atelier Lefèvre', projects: 1, spent: 8.95, budget: 50 },
]

export function SpendOverviewDemo() {
  return (
    <Panel>
      <div className="grid grid-cols-3 gap-2 p-4">
        <Stat label="Spent this month" value="$407.35" note="All clients" />
        <Stat label="Calls today" value="1,284" note="Across all projects" />
        <Stat label="Active" value="12 · 31" note="Clients · projects" />
      </div>
      <div className={clsx('border-t', line)}>
        <PanelHeader title="Spend by client" right="This month" />
        <ul className={clsx('divide-y', 'divide-olive-950/10 dark:divide-white/10')}>
          {spendClients.map(c => {
            const pct = Math.round((c.spent / c.budget) * 100)
            return (
              <li key={c.name} className="px-5 py-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.name}</p>
                    <p className={clsx('text-xs/5', muted)}>
                      {c.projects} project{c.projects === 1 ? '' : 's'}
                    </p>
                  </div>
                  <p className={clsx('text-sm whitespace-nowrap', soft)}>
                    <span className="font-medium text-brand-green dark:text-brand-lime">${c.spent.toFixed(2)}</span>{' '}
                    <span className="text-olive-400">/ ${c.budget}</span>
                  </p>
                </div>
                <div className="mt-2">
                  <Bar pct={pct} tone={pct >= 85 ? 'amber' : 'green'} />
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </Panel>
  )
}

const calls = [
  { status: '200', model: 'claude-haiku-4-5', project: 'Quote generator', tokens: '577+56', cost: '$0.001114', time: '2:14 PM' },
  { status: '200', model: 'gpt-4o-mini', project: 'Site reports', tokens: '49+16', cost: '$0.000022', time: '2:14 PM' },
  { status: '200', model: 'sonar', project: 'Tender scraper', tokens: '1 call', cost: '$0.007000', time: '2:13 PM' },
  { status: 'BLOCKED', model: 'claude-sonnet-5', project: 'Email assistant', tokens: '—', cost: '$0.00', time: '2:13 PM' },
  { status: '200', model: 'text-embedding-3-small', project: 'Quote generator', tokens: '601+0', cost: '$0.000016', time: '2:12 PM' },
]

export function CallsDemo() {
  return (
    <Panel>
      <PanelHeader title="Recent calls" right="Durand Construction · all projects" />
      <div className="flex gap-1.5 px-5 pt-3">
        <span className="rounded-sm bg-olive-950 px-2 py-0.5 text-xs/5 text-white dark:bg-white dark:text-olive-950">By project</span>
        <span className={clsx('rounded-sm px-2 py-0.5 text-xs/5 ring-1 ring-olive-950/10 dark:ring-white/10', soft)}>By tool</span>
        <span className={clsx('rounded-sm px-2 py-0.5 text-xs/5 ring-1 ring-olive-950/10 dark:ring-white/10', soft)}>By model</span>
      </div>
      <div className="overflow-x-auto">
        <table className="mt-2 w-full text-xs/5">
          <thead>
            <tr className={muted}>
              <th className="px-5 py-2 text-left font-medium">Status</th>
              <th className="px-2 py-2 text-left font-medium">Model</th>
              <th className="px-2 py-2 text-left font-medium max-sm:hidden">Project</th>
              <th className="px-2 py-2 text-right font-medium max-sm:hidden">Tokens</th>
              <th className="px-5 py-2 text-right font-medium">Cost</th>
            </tr>
          </thead>
          <tbody>
            {calls.map((c, i) => (
              <tr key={i} className={clsx('border-t', line)}>
                <td className="px-5 py-2.5">
                  <Badge tone={c.status === '200' ? 'green' : 'red'}>{c.status}</Badge>
                </td>
                <td className="px-2 py-2.5 font-mono whitespace-nowrap">{c.model}</td>
                <td className={clsx('px-2 py-2.5 whitespace-nowrap max-sm:hidden', soft)}>{c.project}</td>
                <td className={clsx('px-2 py-2.5 text-right font-mono whitespace-nowrap max-sm:hidden', muted)}>{c.tokens}</td>
                <td className="px-5 py-2.5 text-right font-mono whitespace-nowrap">{c.cost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

/* ------------------------------------------------------------------ */
/* Budgets & limits                                                    */
/* ------------------------------------------------------------------ */

export function BudgetDemo() {
  return (
    <Panel>
      <div className={clsx('border-b px-5 py-4', line)}>
        <p className={clsx('text-xs/5', muted)}>Clients / Moreau Charpente /</p>
        <div className="flex items-center gap-3">
          <p className="font-display text-2xl/8">Site reports</p>
          <Badge tone="green">Active</Badge>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 p-4">
        <Stat label="This month" value="$82.40" tone="green" />
        <Stat label="Monthly budget" value="$100.00" />
        <Stat label="Max per call" value="$0.25" />
      </div>
      <div className="px-5 pb-4">
        <div className={clsx('flex items-center justify-between text-xs/5', muted)}>
          <span>Budget used</span>
          <span>82.4%</span>
        </div>
        <div className="mt-1.5">
          <Bar pct={82.4} tone="amber" />
        </div>
      </div>
      <div className={clsx('border-t px-5 py-4', line)}>
        <p className="font-medium">Allowed tools</p>
        <p className={clsx('text-xs/5', muted)}>Calls to any other tool are blocked.</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {['Anthropic', 'OpenAI', 'Perplexity'].map(t => (
            <span key={t} className="rounded-full bg-brand-lime/20 px-2.5 py-0.5 text-xs/5 font-medium text-brand-green dark:bg-brand-lime/15 dark:text-brand-lime">
              {t}
            </span>
          ))}
        </div>
      </div>
    </Panel>
  )
}

export function BlockedDemo() {
  return (
    <div className="overflow-x-auto bg-olive-950 p-5 sm:p-6">
      <p className="mb-3 font-mono text-xs/5 text-olive-400">
        <span className="rounded-sm bg-red-500/20 px-1.5 py-0.5 text-red-300">403</span> POST /api/proxy/anthropic/v1/messages
      </p>
      <pre className="font-mono text-xs/6 text-[#c0dd97]">{`{
  "status": "BLOCKED",
  "reason": "project_monthly_budget",
  "message": "Project \\"Site reports\\" has spent
    $100.0000 of its $100.00 monthly budget.",
  "controls": [{
    "type": "PROJECT_MONTHLY_BUDGET",
    "limit_usd": 100,
    "spent_usd": 100,
    "remaining_usd": 0,
    "resets_at": "2026-11-01T00:00:00Z"
  }],
  "hint": "You can request more budget: POST
    /api/proxy/requests ..."
}`}</pre>
    </div>
  )
}

const alerts = [
  { tag: 'budget 80%', tone: 'amber' as const, text: 'Moreau Charpente · Site reports reached 80% of $100.00', time: 'Oct 14, 9:02 AM' },
  { tag: 'key frozen', tone: 'red' as const, text: 'Batiplus · Tender scraper spent 12× its hourly rate', time: 'Oct 13, 2:14 AM' },
  { tag: 'budget request', tone: 'neutral' as const, text: 'Durand · Quote generator asks for $150.00 (was $120.00)', time: 'Oct 12, 4:40 PM', action: true },
  { tag: 'budget 50%', tone: 'amber' as const, text: 'Atelier Lefèvre reached 50% of $50.00', time: 'Oct 11, 11:20 AM' },
]

export function AlertsDemo() {
  return (
    <Panel>
      <PanelHeader title="Alerts" right="Budget thresholds, frozen keys, requests" />
      <ul className="divide-y divide-olive-950/10 dark:divide-white/10">
        {alerts.map(a => (
          <li key={a.text} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-5 py-3">
            <Badge tone={a.tone}>{a.tag}</Badge>
            <p className="min-w-0 flex-1 text-sm/6">{a.text}</p>
            {a.action ? (
              <span className="flex gap-1.5">
                <span className="rounded-sm px-2 py-0.5 text-xs/5 ring-1 ring-olive-950/15 dark:ring-white/15">Deny</span>
                <span className="rounded-sm bg-olive-950 px-2 py-0.5 text-xs/5 text-white dark:bg-white dark:text-olive-950">Approve</span>
              </span>
            ) : (
              <span className={clsx('text-xs/5 whitespace-nowrap', muted)}>{a.time}</span>
            )}
          </li>
        ))}
      </ul>
    </Panel>
  )
}

/* ------------------------------------------------------------------ */
/* Client reports                                                      */
/* ------------------------------------------------------------------ */

const reportRows = [
  { client: 'Durand Construction', projects: 3, markup: 30, price: 122.5 },
  { client: 'Moreau Charpente', projects: 4, markup: 30, price: 211.8 },
  { client: 'Batiplus', projects: 2, markup: 25, price: 64.1 },
  { client: 'Atelier Lefèvre', projects: 1, markup: 40, price: 8.95 },
]

export function ReportDemo() {
  const spent = reportRows.reduce((s, r) => s + r.price, 0)
  const rebill = reportRows.reduce((s, r) => s + r.price * (1 + r.markup / 100), 0)
  return (
    <Panel>
      <div className={clsx('flex items-center justify-between gap-4 border-b px-5 py-4', line)}>
        <div>
          <p className="font-display text-2xl/8">Spend by client</p>
          <p className={clsx('text-xs/5', muted)}>October 2026</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs/5">
          <span className="rounded-sm bg-olive-950 px-2 py-1 text-white dark:bg-white dark:text-olive-950">This month</span>
          <span className={clsx('rounded-sm px-2 py-1 ring-1 ring-olive-950/10 max-sm:hidden dark:ring-white/10', soft)}>Last month</span>
          <span className="rounded-sm bg-olive-950 px-2 py-1 text-white dark:bg-white dark:text-olive-950">Export CSV</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 p-4">
        <Stat label="Spent" value={`$${spent.toFixed(2)}`} note="Across all clients" />
        <Stat label="Rebill to clients" value={`$${rebill.toFixed(2)}`} note="With each client’s markup" tone="green" />
        <Stat label="Calls" value="38,412" note="126 blocked" />
      </div>
      <table className="w-full text-sm/6">
        <thead>
          <tr className={clsx('text-xs/5', muted)}>
            <th className="px-5 py-2 text-left font-medium">Client</th>
            <th className="px-2 py-2 text-right font-medium max-sm:hidden">Markup</th>
            <th className="px-2 py-2 text-right font-medium">Price</th>
            <th className="px-5 py-2 text-right font-medium">Rebill</th>
          </tr>
        </thead>
        <tbody>
          {reportRows.map(r => (
            <tr key={r.client} className={clsx('border-t', line)}>
              <td className="px-5 py-2.5">
                <span className="font-medium">{r.client}</span>
                <span className={clsx('ml-2 text-xs/5 max-sm:hidden', muted)}>
                  {r.projects} project{r.projects === 1 ? '' : 's'}
                </span>
              </td>
              <td className={clsx('px-2 py-2.5 text-right tabular-nums max-sm:hidden', soft)}>{r.markup}%</td>
              <td className={clsx('px-2 py-2.5 text-right tabular-nums', soft)}>${r.price.toFixed(2)}</td>
              <td className="px-5 py-2.5 text-right font-medium text-brand-green tabular-nums dark:text-brand-lime">
                ${(r.price * (1 + r.markup / 100)).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  )
}

export function CsvDemo() {
  return (
    <div className="overflow-x-auto bg-olive-950 p-5 sm:p-6">
      <p className="mb-3 font-mono text-xs/5 text-olive-400">durand-construction-2026-10.csv</p>
      <pre className="font-mono text-xs/6 text-[#c0dd97]">{`date,project,tool,model,input_tokens,output_tokens,price_usd,rebill_usd
2026-10-14T14:14,Quote generator,anthropic,claude-haiku-4-5,577,56,0.001114,0.001448
2026-10-14T14:14,Site reports,openai,gpt-4o-mini,49,16,0.000022,0.000029
2026-10-14T14:13,Site reports,perplexity,sonar,,,0.007000,0.009100
2026-10-14T14:12,Quote generator,openai,text-embedding-3-small,601,0,0.000016,0.000021
…

TOTAL,Durand Construction,Oct 2026,27716 rows,,,122.500000,159.250000
                                                        markup 30%`}</pre>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Project keys                                                        */
/* ------------------------------------------------------------------ */

const keys = [
  { id: 'kone_live_a2••••••••', label: 'production', state: 'Active', note: 'Last used 2:14 PM' },
  { id: 'kone_live_a7••••••••', label: 'staging', state: 'Active', note: 'Last used yesterday' },
  { id: 'kone_live_3b••••••••', label: 'old n8n flow', state: 'Revoked', note: 'Revoked Sep 26' },
]

export function KeysDemo() {
  return (
    <Panel>
      <div className={clsx('flex items-center justify-between gap-4 border-b px-5 py-3.5', line)}>
        <div>
          <p className="font-medium">Project keys</p>
          <p className={clsx('text-xs/5', muted)}>One key works for every tool in the catalog. Rotate if a key leaks.</p>
        </div>
        <div className="flex shrink-0 gap-1.5 text-xs/5">
          <span className="rounded-sm px-2 py-1 ring-1 ring-olive-950/15 max-sm:hidden dark:ring-white/15">Issue additional</span>
          <span className="rounded-sm bg-olive-950 px-2 py-1 text-white dark:bg-white dark:text-olive-950">Rotate</span>
        </div>
      </div>
      <ul className="divide-y divide-olive-950/10 dark:divide-white/10">
        {keys.map(k => (
          <li key={k.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3">
            <span className="font-mono text-xs/5">{k.id}</span>
            <Badge tone={k.state === 'Active' ? 'green' : 'neutral'}>{k.state}</Badge>
            <span className={clsx('text-xs/5', soft)}>{k.label}</span>
            <span className={clsx('ml-auto text-xs/5 whitespace-nowrap', muted)}>{k.note}</span>
            {k.state === 'Active' && <span className={clsx('text-xs/5', soft)}>Revoke</span>}
          </li>
        ))}
      </ul>
      <div className={clsx('border-t bg-olive-950/2.5 px-5 py-3 dark:bg-white/5', line)}>
        <p className={clsx('text-xs/5', muted)}>Durand Construction · Quote generator · 2 active keys</p>
      </div>
    </Panel>
  )
}

export function ConnectDemo() {
  return (
    <div className="overflow-x-auto bg-olive-950 p-5 sm:p-6">
      <pre className="font-mono text-xs/6 text-[#c0dd97]">{`from openai import OpenAI
from anthropic import Anthropic

client = OpenAI(
    base_url="https://getkeyone.com/api/proxy/openai/v1",
    api_key="kone_live_a2…",  # Durand · Quote generator
)

# Same key, another tool: no new account, no new secret
claude = Anthropic(
    base_url="https://getkeyone.com/api/proxy/anthropic",
    api_key="kone_live_a2…",
)`}</pre>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Controller (spend review)                                           */
/* ------------------------------------------------------------------ */

export function DigestDemo() {
  return (
    <Panel>
      <PanelHeader title="Latest digest" right="Oct 14, 8:00 AM · 3 findings" />
      <div className={clsx('flex flex-col gap-3 px-5 py-4 text-sm/6', soft)}>
        <p>
          The main item today: <span className="text-olive-950 dark:text-white">Batiplus / Tender scraper [1]</span> is
          on pace to spend $212 this month against a $150 budget. Its daily cost doubled on Oct 9.
        </p>
        <p>
          Also worth a quick fix: <span className="text-olive-950 dark:text-white">Durand / Site reports [2]</span> runs
          a premium model on short summaries, and{' '}
          <span className="text-olive-950 dark:text-white">Atelier Lefèvre [3]</span> has a $50 budget it barely uses.
        </p>
      </div>
      <div className={clsx('flex items-center justify-between border-t bg-olive-950/2.5 px-5 py-3 dark:bg-white/5', line)}>
        <p className={clsx('text-xs/5', muted)}>Runs daily. Nothing changes until you apply it.</p>
        <span className="rounded-sm bg-olive-950 px-2 py-1 text-xs/5 text-white dark:bg-white dark:text-olive-950">Run now</span>
      </div>
    </Panel>
  )
}

const findings = [
  {
    level: 'high',
    kind: 'BURN RATE',
    scope: 'Batiplus / Tender scraper',
    title: 'On pace for $212 against a $150 budget',
    proposal: 'Proposal: review the Oct 9 change, or raise the budget to $220.',
  },
  {
    level: 'medium',
    kind: 'MODEL EFFICIENCY',
    scope: 'Durand / Site reports',
    title: 'claude-sonnet-5 used for calls under 200 tokens',
    proposal: 'Proposal: allow claude-haiku-4-5 only for this project.',
  },
  {
    level: 'low',
    kind: 'IDLE BUDGET',
    scope: 'Atelier Lefèvre / Quotes',
    title: 'Has a $50.00 budget but spent $0.04 in 30 days',
    proposal: 'Proposal: budget $50.00 → $5.00.',
  },
]

export function FindingsDemo() {
  return (
    <Panel>
      <div className={clsx('flex gap-1.5 border-b px-5 py-3 text-xs/5', line)}>
        <span className="rounded-sm bg-olive-950 px-2 py-0.5 text-white dark:bg-white dark:text-olive-950">Proposed · 3</span>
        <span className={clsx('rounded-sm px-2 py-0.5 ring-1 ring-olive-950/10 dark:ring-white/10', soft)}>Applied · 7</span>
        <span className={clsx('rounded-sm px-2 py-0.5 ring-1 ring-olive-950/10 dark:ring-white/10', soft)}>Dismissed · 2</span>
      </div>
      <ul className="divide-y divide-olive-950/10 dark:divide-white/10">
        {findings.map(f => (
          <li key={f.title} className="flex items-start gap-4 px-5 py-3.5">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Badge tone={f.level === 'high' ? 'red' : f.level === 'medium' ? 'amber' : 'neutral'}>{f.level}</Badge>
                <span className={clsx('text-xs/5 tracking-wide', muted)}>{f.kind}</span>
                <span className={clsx('text-xs/5', soft)}>{f.scope}</span>
              </div>
              <p className="mt-1 font-medium">{f.title}</p>
              <p className="text-xs/5 text-brand-green dark:text-brand-lime">{f.proposal}</p>
            </div>
            <div className="flex shrink-0 gap-1.5 pt-0.5 text-xs/5">
              <span className="rounded-sm px-2 py-1 ring-1 ring-olive-950/15 max-sm:hidden dark:ring-white/15">Dismiss</span>
              <span className="rounded-sm bg-olive-950 px-2 py-1 text-white dark:bg-white dark:text-olive-950">Apply</span>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

/* ------------------------------------------------------------------ */
/* Extra views, so no page shows the same screen twice                 */
/* ------------------------------------------------------------------ */

const byModel = [
  { tool: 'Anthropic', model: 'claude-haiku-4-5', calls: '8,412', price: 41.2 },
  { tool: 'Anthropic', model: 'claude-sonnet-5', calls: '3,120', price: 43.19 },
  { tool: 'OpenAI', model: 'gpt-4o-mini', calls: '12,044', price: 22.75 },
  { tool: 'Perplexity', model: 'sonar', calls: '1,930', price: 13.51 },
  { tool: 'OpenAI', model: 'text-embedding-3-small', calls: '2,210', price: 1.85 },
]

// One client's month, broken down by model
export function BreakdownDemo() {
  const max = Math.max(...byModel.map(r => r.price))
  return (
    <Panel>
      <div className={clsx('border-b px-5 py-4', line)}>
        <p className={clsx('text-xs/5', muted)}>Clients /</p>
        <p className="font-display text-2xl/8">Durand Construction</p>
      </div>
      <div className="grid grid-cols-3 gap-2 p-4">
        <Stat label="Cost this month" value="$122.50" tone="green" />
        <Stat label="Monthly budget" value="$180.00" />
        <Stat label="Projects" value="3" />
      </div>
      <div className="flex gap-1.5 px-5 pb-1 text-xs/5">
        <span className={clsx('rounded-sm px-2 py-0.5 ring-1 ring-olive-950/10 dark:ring-white/10', soft)}>By project</span>
        <span className={clsx('rounded-sm px-2 py-0.5 ring-1 ring-olive-950/10 dark:ring-white/10', soft)}>By tool</span>
        <span className="rounded-sm bg-olive-950 px-2 py-0.5 text-white dark:bg-white dark:text-olive-950">By model</span>
      </div>
      <ul className="px-5 py-3">
        {byModel.map(r => (
          <li key={r.model} className="py-2">
            <div className="flex items-center justify-between gap-3 text-xs/5">
              <span className="min-w-0 truncate">
                <span className="font-mono">{r.model}</span> <span className={muted}>· {r.tool}</span>
              </span>
              <span className="whitespace-nowrap">
                <span className={muted}>{r.calls} calls · </span>
                <span className="font-medium">${r.price.toFixed(2)}</span>
              </span>
            </div>
            <div className="mt-1.5">
              <Bar pct={(r.price / max) * 100} />
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

const clientReport = [
  { project: 'Quote generator', calls: '10,622', price: 43.05 },
  { project: 'Site reports', calls: '13,974', price: 36.26 },
  { project: 'Supplier emails', calls: '3,120', price: 43.19 },
]

// One client's report, with its markup applied
export function ClientReportDemo() {
  const markup = 1.3
  const total = clientReport.reduce((s, r) => s + r.price, 0)
  return (
    <Panel>
      <div className={clsx('flex items-center justify-between gap-4 border-b px-5 py-3.5', line)}>
        <div>
          <p className="font-medium">Durand Construction</p>
          <p className={clsx('text-xs/5', muted)}>October 2026 · rebill at 30% markup</p>
        </div>
        <span className="rounded-sm bg-olive-950 px-2 py-1 text-xs/5 text-white dark:bg-white dark:text-olive-950">Export CSV</span>
      </div>
      <div className="grid grid-cols-3 gap-2 p-4">
        <Stat label="Spent" value={`$${total.toFixed(2)}`} />
        <Stat label="Rebill" value={`$${(total * markup).toFixed(2)}`} tone="green" />
        <Stat label="Calls" value="27,716" />
      </div>
      <table className="w-full text-sm/6">
        <thead>
          <tr className={clsx('text-xs/5', muted)}>
            <th className="px-5 py-2 text-left font-medium">Project</th>
            <th className="px-2 py-2 text-right font-medium max-sm:hidden">Calls</th>
            <th className="px-2 py-2 text-right font-medium">Price</th>
            <th className="px-5 py-2 text-right font-medium">Rebill</th>
          </tr>
        </thead>
        <tbody>
          {clientReport.map(r => (
            <tr key={r.project} className={clsx('border-t', line)}>
              <td className="px-5 py-2.5 font-medium">{r.project}</td>
              <td className={clsx('px-2 py-2.5 text-right tabular-nums max-sm:hidden', muted)}>{r.calls}</td>
              <td className={clsx('px-2 py-2.5 text-right tabular-nums', soft)}>${r.price.toFixed(2)}</td>
              <td className="px-5 py-2.5 text-right font-medium text-brand-green tabular-nums dark:text-brand-lime">
                ${(r.price * markup).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  )
}

const projects = [
  { name: 'Quote generator', key: 'kone_live_a2••••••••', budget: '$80.00/mo', spent: '$43.05' },
  { name: 'Site reports', key: 'kone_live_7c••••••••', budget: '$60.00/mo', spent: '$36.26' },
  { name: 'Supplier emails', key: 'kone_live_e9••••••••', budget: '$40.00/mo', spent: '$43.19' },
]

// A client's projects, each with its own key
export function ProjectListDemo() {
  return (
    <Panel>
      <div className={clsx('border-b px-5 py-4', line)}>
        <p className={clsx('text-xs/5', muted)}>Clients /</p>
        <div className="flex items-center gap-3">
          <p className="font-display text-2xl/8">Durand Construction</p>
          <Badge tone="green">Active</Badge>
        </div>
      </div>
      <PanelHeader title="Projects" right="One key per project, valid for every tool" />
      <ul className="divide-y divide-olive-950/10 dark:divide-white/10">
        {projects.map(p => (
          <li key={p.name} className="flex items-center justify-between gap-4 px-5 py-3">
            <div className="min-w-0">
              <p className="font-medium">{p.name}</p>
              <p className="font-mono text-xs/5 text-brand-green dark:text-brand-lime">{p.key}</p>
            </div>
            <div className="flex shrink-0 gap-5 text-right text-xs/5">
              <div className="max-sm:hidden">
                <p className={muted}>Budget</p>
                <p>{p.budget}</p>
              </div>
              <div>
                <p className={muted}>This month</p>
                <p className="font-medium text-brand-green dark:text-brand-lime">{p.spent}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className={clsx('flex items-center justify-between border-t bg-olive-950/2.5 px-5 py-3 dark:bg-white/5', line)}>
        <p className={clsx('text-xs/5', muted)}>3 projects · 3 keys · 0 provider accounts</p>
        <span className="rounded-sm bg-olive-950 px-2 py-1 text-xs/5 text-white dark:bg-white dark:text-olive-950">New project</span>
      </div>
    </Panel>
  )
}

const applied = [
  { scope: 'Atelier Lefèvre / Quotes', change: 'Budget $50.00 → $5.00', when: 'Applied Oct 14' },
  { scope: 'Durand / Site reports', change: 'Allowed models → claude-haiku-4-5', when: 'Applied Oct 12' },
  { scope: 'Batiplus / Tender scraper', change: 'Max per call → $0.25', when: 'Applied Oct 9' },
  { scope: 'Moreau Charpente', change: 'Client markup 0% → 30%', when: 'Applied Oct 6' },
]

// What applying a finding changes
export function AppliedDemo() {
  return (
    <Panel>
      <div className={clsx('flex gap-1.5 border-b px-5 py-3 text-xs/5', line)}>
        <span className={clsx('rounded-sm px-2 py-0.5 ring-1 ring-olive-950/10 dark:ring-white/10', soft)}>Proposed · 3</span>
        <span className="rounded-sm bg-olive-950 px-2 py-0.5 text-white dark:bg-white dark:text-olive-950">Applied · 7</span>
        <span className={clsx('rounded-sm px-2 py-0.5 ring-1 ring-olive-950/10 dark:ring-white/10', soft)}>Dismissed · 2</span>
      </div>
      <ul className="divide-y divide-olive-950/10 dark:divide-white/10">
        {applied.map(a => (
          <li key={a.change} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3">
            <Badge tone="green">applied</Badge>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{a.change}</p>
              <p className={clsx('text-xs/5', soft)}>{a.scope}</p>
            </div>
            <span className={clsx('text-xs/5 whitespace-nowrap', muted)}>{a.when}</span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
