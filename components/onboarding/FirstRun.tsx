'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { ConnectSnippets, useOrigin } from './ConnectSnippets'
import { formatUSD } from '@/lib/utils'

export interface FirstRunProject {
  clientName: string
  projectName: string
  projectId: string
  apiKey: string | null       // null when the key was issued earlier (or handed to the agent)
  deliveredToAgent?: boolean  // the agent collects the key itself (agent-initiated signup)
}

type Mode = 'human' | 'agent'
type AgentId = 'claude-code' | 'cursor' | 'codex' | 'other'
const AGENTS: Array<{ id: AgentId; label: string }> = [
  { id: 'claude-code', label: 'Claude Code' },
  { id: 'cursor', label: 'Cursor' },
  { id: 'codex', label: 'Codex' },
  { id: 'other', label: 'Another agent' },
]

// The welcome screen. Human path: name a client and a project first, then
// the three cards. Agent path: the sandbox already exists, the key comes first.
export function FirstRun({ mode, agencyName, project: initial }: { mode: Mode; agencyName: string; project: FirstRunProject | null }) {
  const [project, setProject] = useState<FirstRunProject | null>(initial)
  const origin = useOrigin()

  return (
    <div className="w-full max-w-3xl px-6 py-12">
      <div className="mb-10 text-center">
        <h1 className="serif text-5xl font-normal">Welcome to key.one</h1>
        <p className="text-md text-ink-muted mt-3">One key per client project. Every model, every tool, spend under control.</p>
      </div>

      <div className="flex flex-col gap-5">
        {mode === 'human' && !project && <ClientCard agencyName={agencyName} onCreated={setProject} />}
        {mode === 'human' && project && <ClientSummary project={project} />}
        {mode === 'agent' && project && <AgentKeyCard project={project} />}

        {project && (
          <>
            <SetupCard n={mode === 'agent' ? 2 : 2} origin={origin} />
            {mode === 'human' && <KeyCard n={3} project={project} />}
            <TryItCard n={mode === 'agent' ? 3 : 4} project={project} origin={origin} />
          </>
        )}
        {!project && mode === 'human' && (
          <>
            <Ghost n={2} title="Set up your agent" />
            <Ghost n={3} title="Your project key" />
            <Ghost n={4} title="Try it out" />
          </>
        )}
      </div>

      <p className="mt-6 text-xs text-ink-subtle text-center">Your wallet starts with $3 of credit, enough for thousands of small calls.</p>
    </div>
  )
}

// ---------------------------------------------------------------- cards

function CardHead({ n, children, right }: { n: number; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="px-6 py-4 flex items-center justify-between gap-4" style={{ borderBottom: '0.5px solid #e0ddd7' }}>
      <div className="flex items-center gap-3 min-w-0">
        <span className="w-7 h-7 rounded-full bg-ink text-bg text-sm flex items-center justify-center shrink-0">{n}</span>
        <div className="text-lg text-ink flex items-center gap-2 flex-wrap">{children}</div>
      </div>
      {right}
    </div>
  )
}

function Ghost({ n, title }: { n: number; title: string }) {
  return (
    <Card className="opacity-50">
      <CardHead n={n}>{title}</CardHead>
    </Card>
  )
}

// Human path, step 1: the real client and its first project
function ClientCard({ agencyName, onCreated }: { agencyName: string; onCreated: (p: FirstRunProject) => void }) {
  const [clientName, setClientName] = useState('')
  const [projectName, setProjectName] = useState('')
  const [budget, setBudget] = useState('50')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function post(path: string, body: unknown) {
    const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Something went wrong')
    return data
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      const c = await post('/api/clients', { name: clientName.trim() || agencyName })
      const p = await post(`/api/clients/${c.id}/projects`, { name: projectName.trim() || 'Default', monthly_budget_usd: budget ? Number(budget) : null })
      onCreated({ clientName: c.name, projectName: p.name, projectId: p.id, apiKey: p.api_key })
    } catch (err) { setError(err instanceof Error ? err.message : String(err)) }
    setBusy(false)
  }

  return (
    <Card>
      <CardHead n={1}>Add your first client</CardHead>
      <form onSubmit={submit} className="p-6 flex flex-col gap-4">
        <p className="text-sm text-ink-muted -mt-1">Clients are cost centers, projects get the keys. Every dollar lands on one client, so reports and rebilling come out per client.</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input id="client" label="Client" placeholder="Acme Corp" value={clientName} onChange={e => setClientName(e.target.value)} autoFocus required />
          <Input id="project" label="Project" placeholder="Blog writer" value={projectName} onChange={e => setProjectName(e.target.value)} required />
          <Input id="budget" label="Monthly budget (USD)" type="number" min="0" step="1" value={budget} onChange={e => setBudget(e.target.value)} />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex items-center gap-4">
          <Button type="submit" loading={busy}>Create project and key</Button>
          <button type="button" onClick={() => { setClientName(agencyName); setProjectName(projectName || 'Internal') }} className="text-sm text-ink-muted hover:text-ink underline underline-offset-2">Just my agency for now</button>
        </div>
      </form>
    </Card>
  )
}

function ClientSummary({ project }: { project: FirstRunProject }) {
  return (
    <Card>
      <CardHead
        n={1}
        right={<Link href={`/dashboard/projects/${project.projectId}`} className="text-xs text-ink-muted hover:text-ink">Manage</Link>}
      >
        <span className="text-green-dark">✓</span>
        <span>{project.clientName} / {project.projectName}</span>
      </CardHead>
    </Card>
  )
}

// Agent path, step 1: the sandbox key, first thing on the screen
function AgentKeyCard({ project }: { project: FirstRunProject }) {
  return (
    <Card>
      <CardHead n={1} right={<Link href={`/dashboard/projects/${project.projectId}`} className="text-xs text-ink-muted hover:text-ink">Manage</Link>}>
        {project.deliveredToAgent ? 'Your agent is connected' : 'Give this key to your agent'}
      </CardHead>
      <div className="p-6 flex flex-col gap-4">
        {project.deliveredToAgent ? (
          <p className="text-sm text-ink-muted">
            Your agent picks up the project key for <span className="text-ink">{project.clientName} / {project.projectName}</span> by itself. Nothing to paste. The sandbox is capped at $10 a month; rename it or add real clients whenever you like.
          </p>
        ) : (
          <p className="text-sm text-ink-muted">
            A <span className="text-ink">{project.clientName} / {project.projectName}</span> project was created for you, capped at $10 a month. Paste this key back into your agent&apos;s chat when it asks. Rename the sandbox or add real clients whenever you like.
          </p>
        )}
        {project.apiKey ? <KeyRow apiKey={project.apiKey} label="Project key" quiet={!!project.deliveredToAgent} /> : <KeyMissing projectId={project.projectId} />}
      </div>
    </Card>
  )
}

// The skill line, per agent, with an MCP tab for management
function SetupCard({ n, origin }: { n: number; origin: string }) {
  const [agent, setAgent] = useState<AgentId>('claude-code')
  const [tab, setTab] = useState<'skill' | 'mcp'>('skill')
  const skillUrl = `${origin}/skill.md`
  const label = AGENTS.find(a => a.id === agent)!.label

  const skillLine = agent === 'other' ? `Read ${skillUrl} and follow its Setup section.` : `set up ${skillUrl}`
  const mcpLine = agent === 'cursor' || agent === 'other'
    ? `{ "mcpServers": { "keyone": { "url": "${origin}/api/mcp", "headers": { "Authorization": "Bearer kone_admin_…" } } } }`
    : `claude mcp add --transport http keyone ${origin}/api/mcp --header "Authorization: Bearer kone_admin_…"`

  return (
    <Card>
      <CardHead
        n={n}
        right={<a href={skillUrl} target="_blank" rel="noreferrer" className="text-xs text-ink-muted hover:text-ink">Docs ↗</a>}
      >
        <span>Set up your</span>
        <span className="relative inline-flex items-center rounded-md px-2.5 py-1 text-sm bg-bg" style={{ border: '0.5px solid #e0ddd7' }}>
          <select value={agent} onChange={e => setAgent(e.target.value as AgentId)} className="bg-transparent outline-none appearance-none pr-5 cursor-pointer text-ink">
            {AGENTS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
          <svg className="absolute right-2 pointer-events-none" width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </span>
      </CardHead>
      <div className="px-6">
        <div className="flex gap-5 text-sm" style={{ borderBottom: '0.5px solid #e0ddd7' }}>
          {(['skill', 'mcp'] as const).map(t => (
            <button key={t} type="button" onClick={() => setTab(t)} className={`py-3 -mb-px ${tab === t ? 'text-ink border-b-2 border-ink' : 'text-ink-muted hover:text-ink'}`}>
              {t === 'skill' ? 'Skill' : 'MCP'}
            </button>
          ))}
        </div>
      </div>
      <div className="p-6 flex flex-col gap-3">
        {tab === 'skill' ? (
          <>
            <p className="text-sm text-ink-muted">In {label}&apos;s chat, send:</p>
            <CodeLine value={skillLine} />
            <p className="text-xs text-ink-subtle">The agent installs the key.one skill, asks you for the project key, routes this codebase&apos;s AI calls through key.one, and makes a test call.</p>
          </>
        ) : (
          <>
            <p className="text-sm text-ink-muted">To let {label} manage clients, projects and budgets, connect the MCP server with an agency key from <Link href="/dashboard/settings" className="underline underline-offset-2 hover:text-ink">Settings</Link>:</p>
            <CodeLine value={mcpLine} />
            <p className="text-xs text-ink-subtle">The skill is enough for spending. MCP adds management: create projects, read spend, approve budget requests.</p>
          </>
        )}
      </div>
    </Card>
  )
}

// Human path: the key, quiet, with Manage
function KeyCard({ n, project }: { n: number; project: FirstRunProject }) {
  return (
    <Card>
      <CardHead n={n} right={<Link href={`/dashboard/projects/${project.projectId}`} className="text-xs text-ink-muted hover:text-ink">Manage</Link>}>
        Your project key for {project.projectName}
      </CardHead>
      <div className="p-6 flex flex-col gap-3">
        <p className="text-sm text-ink-muted">Give this key to your agent when it asks. It spends from your wallet within the project&apos;s budget and every call is logged under {project.clientName}.</p>
        {project.apiKey ? <KeyRow apiKey={project.apiKey} label="Project key" /> : <KeyMissing projectId={project.projectId} />}
      </div>
    </Card>
  )
}

const PROMPTS = (origin: string) => [
  {
    title: 'Connect this codebase',
    text: `Connect this codebase to key.one: ask me for the project key, route its OpenAI and Anthropic calls through key.one, and make a test call. Skill: ${origin}/skill.md`,
  },
  {
    title: 'Search the web',
    text: 'Using key.one, search the web with Perplexity: what changed in the EU AI Act this month? Tell me what the call cost.',
  },
  {
    title: 'Generate an image',
    text: 'Using key.one, generate an image of a paper plane over a city skyline with gpt-image-1-mini at low quality, save it here, and tell me what it cost.',
  },
  {
    title: 'Check the budget',
    text: 'Using key.one, tell me what this project has spent this month, how much budget is left, and which models it used.',
  },
]

// Premade prompts plus a live watcher for the first real call
function TryItCard({ n, project, origin }: { n: number; project: FirstRunProject; origin: string }) {
  const router = useRouter()
  const [first, setFirst] = useState<{ model: string | null; cost: number; at: string } | null>(null)

  useEffect(() => {
    let stop = false
    async function poll() {
      try {
        const r = await fetch(`/api/analytics/projects/${project.projectId}`)
        if (r.ok) {
          const d = await r.json() as { recent_calls?: Array<{ status: string; model: string | null; cost_usd: number; created_at: string }> }
          const call = (d.recent_calls ?? []).find(c => c.status === 'completed')
          if (call && !stop) { setFirst({ model: call.model, cost: Number(call.cost_usd), at: call.created_at }); return }
        }
      } catch { /* keep polling */ }
      if (!stop) setTimeout(poll, 5000)
    }
    poll()
    return () => { stop = true }
  }, [project.projectId])

  return (
    <Card>
      <CardHead n={n}>Try it out</CardHead>
      <div className="p-6 flex flex-col gap-4">
        <p className="text-sm text-ink-muted">key.one is ready for your agent. Copy any prompt below and send it.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PROMPTS(origin).map(p => <PromptTile key={p.title} title={p.title} text={p.text} />)}
        </div>

        {first ? (
          <div className="rounded-lg p-4 bg-green-pale flex items-center justify-between gap-4 flex-wrap" style={{ border: '0.5px solid #C0DD97' }}>
            <div>
              <p className="text-sm font-medium text-green-dark">First call received</p>
              <p className="text-xs text-ink-muted mt-0.5">
                <span className="font-mono text-ink">{first.model ?? 'unknown model'}</span> · {formatUSD(first.cost, 6)} · {new Date(first.at).toLocaleTimeString()} · logged under {project.clientName} / {project.projectName}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => { router.push(`/dashboard/projects/${project.projectId}`); router.refresh() }}>Open the project</Button>
              <Button size="sm" variant="secondary" onClick={() => { router.push('/dashboard'); router.refresh() }}>Overview</Button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg px-4 py-3 bg-bg flex items-center gap-3" style={{ border: '0.5px solid #e0ddd7' }}>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-mid opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-mid" />
            </span>
            <p className="text-sm text-ink-muted">Waiting for the first call from your agent or your code… this turns green with the model and the cost when it lands.</p>
          </div>
        )}

        <details>
          <summary className="text-xs text-ink-muted hover:text-ink cursor-pointer select-none">No agent? OpenAI SDK, Anthropic SDK and curl snippets</summary>
          <div className="mt-3">
            <ConnectSnippets apiKey={project.apiKey ?? 'kone_live_…'} projectName={project.projectName} manualOnly />
          </div>
        </details>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------- bits

function PromptTile({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button type="button" onClick={copy} className="text-left rounded-lg p-4 bg-bg hover:bg-green-pale transition-colors flex gap-3" style={{ border: '0.5px solid #e0ddd7' }}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0 text-ink-subtle"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor"/><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" stroke="currentColor"/></svg>
      <span className="min-w-0">
        <span className="block text-sm text-ink">{copied ? '✓ Copied, send it to your agent' : title}</span>
        <span className="block text-xs text-ink-muted truncate mt-0.5">{text}</span>
      </span>
    </button>
  )
}

function CodeLine({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="rounded-lg bg-bg flex items-center gap-3 pl-4 pr-2 py-2" style={{ border: '0.5px solid #e0ddd7' }}>
      <code className="text-sm font-mono text-ink flex-1 min-w-0 break-all">{value}</code>
      <button type="button" onClick={copy} className="shrink-0 px-3 py-1.5 rounded-md text-xs font-medium bg-ink text-bg hover:opacity-90">{copied ? '✓ Copied' : 'Copy'}</button>
    </div>
  )
}

function KeyMissing({ projectId }: { projectId: string }) {
  return (
    <div className="rounded-lg px-4 py-3 bg-bg text-xs text-ink-muted" style={{ border: '0.5px solid #e0ddd7' }}>
      The key was shown when the project was created. Need it again? <Link href={`/dashboard/projects/${projectId}`} className="underline underline-offset-2 hover:text-ink">Rotate the key</Link> on the project page to get a new one.
    </div>
  )
}

// The raw key, masked until revealed, one line, its own copy.
export function KeyRow({ apiKey, label = 'Project key', quiet = false }: { apiKey: string; label?: string; quiet?: boolean }) {
  const [shown, setShown] = useState(false)
  const [copied, setCopied] = useState(false)
  const masked = `${apiKey.slice(0, 14)}${'•'.repeat(12)}${apiKey.slice(-4)}`
  async function copy() {
    await navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="rounded-lg px-4 py-3 bg-bg flex items-center justify-between gap-4 flex-wrap" style={{ border: '0.5px solid #e0ddd7' }}>
      <div className="min-w-0 flex items-center gap-3">
        <span className="text-2xs px-1.5 py-0.5 rounded text-ink-muted shrink-0" style={{ background: '#F1EFE8' }}>{label}</span>
        <code className="text-sm font-mono text-ink break-all">{shown ? apiKey : masked}</code>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <button type="button" onClick={() => setShown(v => !v)} className="text-xs text-ink-muted hover:text-ink">{shown ? 'Hide' : 'Show'}</button>
        <button type="button" onClick={copy} className="text-xs text-ink-muted hover:text-ink">{copied ? '✓ Copied' : 'Copy'}</button>
      </div>
      {!quiet && <p className="w-full text-2xs text-ink-subtle">Shown once. If you lose it, rotate the key from the project page.</p>}
    </div>
  )
}
