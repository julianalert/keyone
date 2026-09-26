'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { ConnectSnippets, agentMessage, useOrigin } from './ConnectSnippets'
import { formatUSD } from '@/lib/utils'

type Step = 1 | 2 | 3 | 4

// Shown instead of the overview until the agency has its first client.
export function FirstRun({ agencyName }: { agencyName: string }) {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [clientName, setClientName] = useState('')
  const [clientId, setClientId] = useState<string | null>(null)
  const [projectName, setProjectName] = useState('')
  const [budget, setBudget] = useState('50')
  const [projectId, setProjectId] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [test, setTest] = useState<{ reply: string; cost: string; model: string } | null>(null)
  const origin = useOrigin()

  async function post(path: string, body: unknown) {
    const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Something went wrong')
    return data
  }

  async function createClient(name: string) {
    setBusy(true); setError(null)
    try {
      const c = await post('/api/clients', { name })
      setClientId(c.id); setClientName(c.name); setStep(2)
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
    setBusy(false)
  }

  async function createProject() {
    if (!clientId) return
    setBusy(true); setError(null)
    try {
      const p = await post(`/api/clients/${clientId}/projects`, { name: projectName.trim(), monthly_budget_usd: budget ? Number(budget) : null })
      setProjectId(p.id); setApiKey(p.api_key); setStep(3)
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
    setBusy(false)
  }

  async function sendTestCall() {
    if (!apiKey) return
    setBusy(true); setError(null)
    try {
      const res = await fetch('/api/proxy/openai', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'cheapest', max_tokens: 30, messages: [{ role: 'user', content: `Say hello to ${agencyName} in one short sentence.` }] }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? data.error?.message ?? data.error ?? 'The call failed')
      setTest({
        reply: data.choices?.[0]?.message?.content ?? JSON.stringify(data).slice(0, 200),
        cost: res.headers.get('x-cost-usd') ?? '0',
        model: (res.headers.get('x-model-resolved') ?? '').split('->').pop()?.trim() || data.model || 'cheapest',
      })
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
    setBusy(false)
  }

  const steps = ['Client', 'Project', 'Connect', 'First call']

  return (
    <div className="w-full max-w-2xl px-6 py-12">
      <div className="mb-8">
        <p className="section-label">Welcome</p>
        <h1 className="serif text-4xl font-normal">Let&apos;s make your first call</h1>
        <p className="text-sm text-ink-muted mt-2">Two minutes. A client, a project, a key, one request. You can skip and explore any time.</p>
      </div>

      <div className="flex items-center gap-2 mb-8">
        {steps.map((label, i) => {
          const n = (i + 1) as Step
          const state = n < step ? 'done' : n === step ? 'current' : 'todo'
          return (
            <div key={label} className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center ${state === 'done' ? 'bg-green-mid text-ink' : state === 'current' ? 'bg-ink text-bg' : 'bg-border text-ink-muted'}`}>{state === 'done' ? '✓' : n}</span>
              <span className={`text-sm ${state === 'current' ? 'text-ink' : 'text-ink-muted'}`}>{label}</span>
              {i < steps.length - 1 && <span className="w-6 h-px bg-border mx-1" />}
            </div>
          )
        })}
      </div>

      <Card className="p-6">
        {step === 1 && (
          <form onSubmit={e => { e.preventDefault(); createClient(clientName.trim()) }} className="flex flex-col gap-4">
            <div>
              <h2 className="serif text-2xl font-normal">Who is this work for?</h2>
              <p className="text-sm text-ink-muted mt-1">Clients are cost centers. Every dollar of spend lands on one, so reports and rebilling come out per client.</p>
            </div>
            <Input id="client" label="Client name" placeholder="Acme Corp" value={clientName} onChange={e => setClientName(e.target.value)} autoFocus required />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex items-center gap-3">
              <Button type="submit" loading={busy}>Continue</Button>
              <button type="button" onClick={() => createClient(agencyName)} className="text-sm text-ink-muted hover:text-ink underline underline-offset-2">Just my agency for now</button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={e => { e.preventDefault(); createProject() }} className="flex flex-col gap-4">
            <div>
              <h2 className="serif text-2xl font-normal">Name the first project for {clientName}</h2>
              <p className="text-sm text-ink-muted mt-1">A project gets one key that works for every model and tool. Its budget is enforced before each call.</p>
            </div>
            <Input id="project" label="Project name" placeholder="Blog writer" value={projectName} onChange={e => setProjectName(e.target.value)} autoFocus required />
            <Input id="budget" label="Monthly budget (USD, optional)" type="number" min="0" step="1" value={budget} onChange={e => setBudget(e.target.value)} />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div><Button type="submit" loading={busy}>Create project and key</Button></div>
          </form>
        )}

        {step === 3 && apiKey && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="serif text-2xl font-normal">Connect {projectName}</h2>
              <p className="text-sm text-ink-muted mt-2 leading-relaxed">
                Paste one message into Claude Code or Cursor. The agent installs key.one, swaps your provider keys for this project&apos;s key, and makes a test call.
                From then on every call is priced, checked against the budget, and logged under <span className="text-ink">{clientName} / {projectName}</span>.
              </p>
            </div>

            {/* Primary: the message for the agent */}
            <div className="bg-ink rounded-lg p-5">
              <p className="text-2xs text-ink-subtle uppercase tracking-widest mb-2">Message for Claude Code / Cursor</p>
              <pre className="text-xs text-bg/90 font-mono rounded-md p-3 whitespace-pre-wrap break-all" style={{ background: '#2a2a27' }}>{agentMessage(origin, apiKey, projectName)}</pre>
              <div className="mt-3">
                <CopyButton value={agentMessage(origin, apiKey, projectName)} label="Copy message, then paste it into your agent" big />
              </div>
            </div>

            {/* Secondary: the raw key, for people who need just that */}
            <KeyRow apiKey={apiKey} />

            <details>
              <summary className="text-xs text-ink-muted hover:text-ink cursor-pointer select-none">Writing the code yourself? OpenAI SDK, Anthropic SDK, and curl snippets</summary>
              <div className="mt-3">
                <ConnectSnippets apiKey={apiKey} projectName={projectName} manualOnly />
              </div>
            </details>

            <div><Button onClick={() => setStep(4)}>Done, let&apos;s test it</Button></div>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="serif text-2xl font-normal">Make the first call</h2>
              <p className="text-sm text-ink-muted mt-1">One tiny request on the cheapest OpenAI model, through the proxy, with your new key. Costs a fraction of a cent.</p>
            </div>
            {!test ? (
              <>
                {error && <p className="text-xs text-red-500">{error}</p>}
                <div><Button onClick={sendTestCall} loading={busy}>Send a test call</Button></div>
              </>
            ) : (
              <>
                <div className="rounded-lg p-4 bg-green-pale" style={{ border: '0.5px solid #C0DD97' }}>
                  <p className="text-sm text-ink mb-3">&ldquo;{test.reply}&rdquo;</p>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div><p className="text-ink-subtle">Model</p><p className="font-mono text-ink">{test.model}</p></div>
                    <div><p className="text-ink-subtle">Cost</p><p className="text-ink">{formatUSD(Number(test.cost), 6)}</p></div>
                    <div><p className="text-ink-subtle">Attributed to</p><p className="text-ink">{clientName} / {projectName}</p></div>
                  </div>
                </div>
                <p className="text-sm text-ink-muted">That&apos;s the whole loop: the key identifies the project, the budget was checked, the cost was priced and logged under the client. Everything else builds on that.</p>
                <div className="flex gap-3">
                  <Button onClick={() => { router.push(`/dashboard/projects/${projectId}`); router.refresh() }}>Open the project</Button>
                  <Button variant="secondary" onClick={() => { router.push('/dashboard'); router.refresh() }}>Go to overview</Button>
                </div>
              </>
            )}
          </div>
        )}
      </Card>

      <p className="mt-4 text-xs text-ink-subtle">Your wallet starts with $3 of credit, enough for thousands of small calls.</p>
    </div>
  )
}

function CopyButton({ value, label, dark = false, big = false }: { value: string; label: string; dark?: boolean; big?: boolean }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  if (big) {
    return (
      <button type="button" onClick={copy} className="w-full px-4 py-2.5 rounded-md text-sm font-medium bg-green-mid text-ink hover:opacity-90 transition-opacity">
        {copied ? '✓ Copied. Now paste it into your agent.' : label}
      </button>
    )
  }
  return (
    <button type="button" onClick={copy} className={`text-xs ${dark ? 'text-ink-subtle hover:text-green-light' : 'text-ink-muted hover:text-ink'}`}>
      {copied ? '✓ Copied' : label}
    </button>
  )
}

// The raw key, kept quiet: masked until revealed, one line, its own copy.
function KeyRow({ apiKey }: { apiKey: string }) {
  const [shown, setShown] = useState(false)
  const masked = `${apiKey.slice(0, 14)}${'•'.repeat(12)}${apiKey.slice(-4)}`
  return (
    <div className="rounded-lg px-4 py-3 bg-bg flex items-center justify-between gap-4 flex-wrap" style={{ border: '0.5px solid #e0ddd7' }}>
      <div className="min-w-0">
        <p className="text-2xs text-ink-subtle uppercase tracking-wider mb-0.5">Just need the key?</p>
        <code className="text-xs font-mono text-ink break-all">{shown ? apiKey : masked}</code>
        <p className="text-2xs text-ink-subtle mt-1">Shown once. If you lose it, rotate the key from the project page.</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <button type="button" onClick={() => setShown(v => !v)} className="text-xs text-ink-muted hover:text-ink">{shown ? 'Hide' : 'Show'}</button>
        <CopyButton value={apiKey} label="Copy key" />
      </div>
    </div>
  )
}
