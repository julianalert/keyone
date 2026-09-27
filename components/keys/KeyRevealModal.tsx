'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ConnectSnippets, useOrigin } from '@/components/onboarding/ConnectSnippets'

interface Props {
  title: string
  subtitle?: string
  apiKey: string
  onClose: () => void
}

function CopyButton({ value, label, big = false, dark = false }: { value: string; label: string; big?: boolean; dark?: boolean }) {
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

// Shown once after a project key is minted. Same shape as onboarding step 3:
// the one line for the agent first, the raw key second, hand-written snippets folded.
export function KeyRevealModal({ title, subtitle, apiKey, onClose }: Props) {
  const origin = useOrigin()
  const [shown, setShown] = useState(false)
  const setupLine = `set up ${origin}/skill.md`
  const masked = `${apiKey.slice(0, 14)}${'•'.repeat(12)}${apiKey.slice(-4)}`

  return (
    <div className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <Card className="w-full max-w-xl p-6 my-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
        <div className="mb-5">
          <Badge variant="green" className="mb-3">Key issued</Badge>
          <h2 className="serif text-2xl font-normal mb-1">Connect {title}</h2>
          {subtitle && <p className="text-sm text-ink-muted">{subtitle}</p>}
        </div>

        <div className="bg-ink rounded-lg p-5 mb-4">
          <p className="text-sm font-medium text-bg mb-1">Paste this into Claude Code or Cursor</p>
          <p className="text-xs text-ink-subtle mb-3">The agent installs the key.one skill, asks you for the project key below, wires it into the codebase, and makes a test call.</p>
          <pre className="text-base text-green-light font-mono rounded-md p-4 whitespace-pre-wrap break-all" style={{ background: '#2a2a27' }}>{setupLine}</pre>
          <div className="mt-3"><CopyButton value={setupLine} label="Copy" big /></div>
        </div>

        <div className="rounded-lg px-4 py-3 bg-bg flex items-center justify-between gap-4 flex-wrap mb-4" style={{ border: '0.5px solid #e0ddd7' }}>
          <div className="min-w-0">
            <p className="text-2xs text-ink-subtle uppercase tracking-wider mb-0.5">Project key (give it to the agent when it asks)</p>
            <code className="text-xs font-mono text-ink break-all">{shown ? apiKey : masked}</code>
            <p className="text-2xs text-red-600 mt-1">Shown once. If you lose it, rotate the key from the project page.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button type="button" onClick={() => setShown(v => !v)} className="text-xs text-ink-muted hover:text-ink">{shown ? 'Hide' : 'Show'}</button>
            <CopyButton value={apiKey} label="Copy key" />
          </div>
        </div>

        <details className="mb-5">
          <summary className="text-xs text-ink-muted hover:text-ink cursor-pointer select-none">Writing the code yourself? OpenAI SDK, Anthropic SDK, Vercel AI SDK, and curl snippets</summary>
          <div className="mt-3"><ConnectSnippets apiKey={apiKey} projectName={title} manualOnly compact /></div>
        </details>

        <div className="flex justify-end">
          <Button onClick={onClose}>Done</Button>
        </div>
      </Card>
    </div>
  )
}
