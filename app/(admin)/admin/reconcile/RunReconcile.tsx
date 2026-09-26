'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

export function RunReconcile() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [days, setDays] = useState(3)

  async function run() {
    setBusy(true); setMsg(null)
    const res = await fetch(`/api/admin/reconcile?days=${days}`, { method: 'POST' })
    const d = await res.json()
    setBusy(false)
    if (!res.ok) { setMsg(d.error ?? 'Failed'); return }
    setMsg((d.providers as { provider: string; status: string; detail?: string; variance_pct: number | null }[]).map(p => `${p.provider}: ${p.status}${p.detail ? ` (${p.detail})` : ''}${p.variance_pct !== null ? ` ${p.variance_pct > 0 ? '+' : ''}${p.variance_pct.toFixed(1)}%` : ''}`).join(' · '))
    router.refresh()
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {msg && <span className="text-xs text-ink-muted max-w-md">{msg}</span>}
      <select value={days} onChange={e => setDays(Number(e.target.value))} className="px-2 py-1.5 bg-bg border rounded text-xs text-ink outline-none" style={{ borderWidth: '0.5px', borderColor: '#e0ddd7' }}>
        <option value={3}>Last 3 days</option>
        <option value={7}>Last 7 days</option>
        <option value={31}>Last 31 days</option>
      </select>
      <Button size="sm" loading={busy} onClick={run}>Run now</Button>
    </div>
  )
}
