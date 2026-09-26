'use client'

import { useState, useEffect } from 'react'

type Tab = 'agents' | 'openai' | 'anthropic' | 'vercel' | 'curl'

// The public origin of this deployment, read after mount so server and client match.
export function useOrigin(): string {
  const [origin, setOrigin] = useState('')
  useEffect(() => { setOrigin(process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '') || window.location.origin) }, [])
  return origin
}

// Snippets for using a project key. Agent first, unless `manualOnly` hides
// that tab because the agent message is shown elsewhere.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ConnectSnippets({ apiKey, projectName, compact = false, manualOnly = false }: { apiKey: string; projectName?: string; compact?: boolean; manualOnly?: boolean }) {
  const [tab, setTab] = useState<Tab>(manualOnly ? 'openai' : 'agents')
  const origin = useOrigin()
  const [copied, setCopied] = useState(false)

  const snippets: Record<Tab, { tab: string; instruction: string; code: string }> = {
    agents: {
      tab: 'Claude Code / Cursor',
      instruction: 'Paste this into the agent\u2019s chat. It installs the key.one skill, asks you for the project key, wires it into the codebase, and makes a test call.',
      code: `set up ${origin}/skill.md`,
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
    vercel: {
      tab: 'Vercel AI SDK',
      instruction: 'Create the provider with a custom base URL and the project key; everything else in your app stays the same.',
      code: `import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'

export const openai = createOpenAI({
  baseURL: process.env.KEYONE_OPENAI_BASE_URL,   // ${origin}/api/proxy/openai/v1
  apiKey: process.env.KEYONE_API_KEY,
})
export const anthropic = createAnthropic({
  baseURL: process.env.KEYONE_ANTHROPIC_BASE_URL, // ${origin}/api/proxy/anthropic
  apiKey: process.env.KEYONE_API_KEY,
})
// then: generateText({ model: openai('cheapest'), prompt: 'Hello' })`,
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
