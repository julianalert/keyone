'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'

interface Milestones { has_client: boolean; has_project: boolean; has_call: boolean; has_budget: boolean; has_agent: boolean }

// Overview checklist until the four milestones are done, or dismissed.
export function Checklist({ m, firstProjectId }: { m: Milestones; firstProjectId: string | null }) {
  const router = useRouter()
  const [hidden, setHidden] = useState(false)
  if (hidden) return null

  const items = [
    { done: m.has_project, label: 'Create a client and a project', href: '/dashboard/clients', hint: 'Each project gets one key for every tool' },
    { done: m.has_call, label: 'Make a first call with the key', href: firstProjectId ? `/dashboard/projects/${firstProjectId}` : '/dashboard/clients', hint: 'Point an SDK at key.one, or send a test call from the project page' },
    { done: m.has_budget, label: 'Set a monthly budget', href: firstProjectId ? `/dashboard/projects/${firstProjectId}` : '/dashboard/clients', hint: 'Calls stop at the limit, and agents can request more' },
    { done: m.has_agent, label: 'Connect Claude Code or Cursor', href: '/dashboard/settings', hint: 'Create an agency key, then paste one line into the agent' },
  ]
  const doneCount = items.filter(i => i.done).length

  async function dismiss() {
    setHidden(true)
    await fetch('/api/onboarding', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dismissed: true }) })
    router.refresh()
  }

  return (
    <Card className="mb-6">
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '0.5px solid #e0ddd7' }}>
        <div>
          <p className="text-sm font-medium text-ink">Getting started</p>
          <p className="text-xs text-ink-muted">{doneCount} of {items.length} done</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard?setup=1" className="text-xs text-ink-muted hover:text-ink">Guided setup</Link>
          <button onClick={dismiss} className="text-xs text-ink-muted hover:text-ink">Hide</button>
        </div>
      </div>
      <div>
        {items.map((it, i) => (
          <Link key={it.label} href={it.href} className="px-5 py-3 flex items-center gap-3 hover:bg-border/30 transition-colors" style={i < items.length - 1 ? { borderBottom: '0.5px solid #e0ddd7' } : undefined}>
            <span className={`w-5 h-5 rounded-full text-2xs flex items-center justify-center shrink-0 ${it.done ? 'bg-green-mid text-ink' : 'border border-border text-transparent'}`} style={!it.done ? { borderWidth: '0.5px' } : undefined}>✓</span>
            <div className="min-w-0">
              <p className={`text-sm ${it.done ? 'text-ink-muted line-through' : 'text-ink'}`}>{it.label}</p>
              {!it.done && <p className="text-xs text-ink-muted">{it.hint}</p>}
            </div>
            {!it.done && <span className="ml-auto text-ink-muted text-sm">→</span>}
          </Link>
        ))}
      </div>
    </Card>
  )
}
