'use client'

import { useState, useEffect } from 'react'

type Tab = 'agents' | 'openai' | 'anthropic' | 'curl'

// The public origin of this deployment, read after mount so server and client match.
export function useOrigin(): string {
  const [origin, setOrigin] = useState('')
  useEffect(() => { setOrigin(process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '') || window.location.origin) }, [])
  return origin
}

// The one message a user pastes into Claude Code or Cursor. The agent does the rest.
export function agentMessage(origin: string, apiKey: string, projectName?: string): string {
  const label = projectName ? `"${projectName}"` : 'this project'
  return `Set up key.one for ${label} in this codebase.

1. Install the key.one skill from ${origin}/skill.md and follow it.
2. This is the project key. Use it for every OpenAI and Anthropic call instead of provider keys:
   ${apiKey}
   OpenAI SDK:    base_url = ${origin}/api/proxy/openai/v1
   Anthropic SDK: base_url = ${origin}/api/proxy/anthropic
3. Put the key and base URLs in this project's environment config, replace any direct OPENAI_API_KEY / ANTHROPIC_API_KEY usage, and keep the key out of git.
4. Make one small test call with model "cheapest" and show me the reply and the X-Cost-USD header.`
}

// Snippets for using a project key. Agent first, unless `manualOnly` hides
// that tab because the agent message is shown elsewhere.
export function ConnectSnippets({ apiKey, projectName, compact = false, manualOnly = false }: { apiKey: string; projectName?: string; compact?: boolean; manualOnly?: boolean }) {
  const [tab, setTab] = useState<Tab>(manualOnly ? 'openai' : 'agents')
  const origin = useOrigin()
  const [copied, setCopied] = useState(false)

  const snippets: Record<Tab, { tab: string; instruction: string; code: string }> = {
    agents: {
      tab: 'Claude Code / Cursor',
      instruction: 'Copy this whole message and paste it into your coding agent’s chat. It installs key.one, swaps your provider keys for this one, and makes a test call.',
      code: agentMessage(origin, apiKey, projectName),
    },
    openai: {
      tab: 'OpenAI SDK',
      instruction: 'Where your code creates the OpenAI client, set the base URL to key.one and use the project key as the API key. Nothing else changes.',
      code: `from openai import OpenAI

client = OpenAI(
    base_url="${origin}/api/proxy/openai/v1",
    api_key="${apiKey}",
)
reply = client.chat.completions.create(
    model="cheapest",   # or any OpenAI model id
    messages=[{"role": "user", "content": "Hello"}],
)`,
    },
    anthropic: {
      tab: 'Anthropic SDK',
      instruction: 'Same idea for Claude: point the Anthropic client at key.one and pass the project key. Streaming and every model id work as before.',
      code: `from anthropic import Anthropic

client = Anthropic(
    base_url="${origin}/api/proxy/anthropic",
    api_key="${apiKey}",
)
reply = client.messages.create(
    model="cheapest",   # or any Claude model id
    max_tokens=256,
    messages=[{"role": "user", "content": "Hello"}],
)`,
    },
    curl: {
      tab: 'curl',
      instruction: 'Any HTTP client works. The key goes in the Authorization header; the path picks the provider.',
      code: `curl -X POST ${origin}/api/proxy/openai \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"cheapest","messages":[{"role":"user","content":"Hello"}]}'`,
    },
  }

  const tabs = (Object.keys(snippets) as Tab[]).filter(t => !(manualOnly && t === 'agents'))

  async function copy() {
    await navigator.clipboard.writeText(snippets[tab].code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div>
      <div className="flex gap-1.5 flex-wrap mb-3">
        {tabs.map(t => (
          <button key={t} type="button" onClick={() => setTab(t)} className={`px-3 py-1.5 rounded text-xs transition-colors ${tab === t ? 'bg-ink text-bg' : 'text-ink-muted hover:text-ink border border-border'}`} style={{ borderWidth: '0.5px' }}>
            {snippets[t].tab}{t === 'agents' && tab !== t ? ' · recommended' : ''}
          </button>
        ))}
      </div>
      <p className="text-sm text-ink mb-2">{snippets[tab].instruction}</p>
      <div className="relative">
        <pre className={`text-xs text-ink font-mono bg-bg rounded-lg p-3 pr-20 overflow-x-auto whitespace-pre-wrap break-all ${compact ? 'max-h-48' : ''}`} style={{ border: '0.5px solid #e0ddd7' }}>{snippets[tab].code}</pre>
        <button type="button" onClick={copy} className="absolute top-2 right-2 text-xs px-2.5 py-1 rounded bg-ink text-bg hover:opacity-80">{copied ? '✓ Copied' : tab === 'agents' ? 'Copy message' : 'Copy'}</button>
      </div>
    </div>
  )
}
