'use client'

import { useState, useEffect } from 'react'

type Tab = 'openai' | 'anthropic' | 'curl' | 'agents'

// Copy-ready snippets with the key and the real origin filled in.
export function ConnectSnippets({ apiKey, compact = false }: { apiKey: string; compact?: boolean }) {
  const [tab, setTab] = useState<Tab>('openai')
  const [origin, setOrigin] = useState('')
  const [copied, setCopied] = useState(false)
  useEffect(() => { setOrigin(process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '') || window.location.origin) }, [])

  const snippets: Record<Tab, { label: string; code: string }> = {
    openai: {
      label: 'OpenAI SDK',
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
      label: 'Anthropic SDK',
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
      label: 'curl',
      code: `curl -X POST ${origin}/api/proxy/openai \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"cheapest","messages":[{"role":"user","content":"Hello"}]}'`,
    },
    agents: {
      label: 'Claude Code / Cursor',
      code: `# Paste into the agent's chat. It installs the key.one skill,
# then give it this project key when it asks.
set up ${origin}/skill.md

# Project key: ${apiKey}`,
    },
  }

  async function copy() {
    await navigator.clipboard.writeText(snippets[tab].code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {(Object.keys(snippets) as Tab[]).map(t => (
            <button key={t} type="button" onClick={() => setTab(t)} className={`px-2.5 py-1 rounded text-xs transition-colors ${tab === t ? 'bg-ink text-bg' : 'text-ink-muted hover:text-ink border border-border'}`} style={{ borderWidth: '0.5px' }}>
              {snippets[t].label}
            </button>
          ))}
        </div>
        <button type="button" onClick={copy} className="text-xs text-ink-muted hover:text-ink">{copied ? '✓ Copied' : 'Copy'}</button>
      </div>
      <pre className={`text-xs text-ink font-mono bg-bg rounded-lg p-3 overflow-x-auto ${compact ? 'max-h-40' : ''}`} style={{ border: '0.5px solid #e0ddd7' }}>{snippets[tab].code}</pre>
    </div>
  )
}
