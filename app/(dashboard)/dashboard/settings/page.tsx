'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'

interface AgencyKeyRow {
  id: string
  name: string
  key_prefix: string
  last_used_at: string | null
  revoked_at: string | null
  created_at: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [agencyName, setAgencyName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [ctl, setCtl] = useState({ alert_email: '', webhook_url: '', spike_multiplier: '10', spike_floor_usd: '10', auto_approve_increase_usd: '0' })
  const [savingCtl, setSavingCtl] = useState(false)
  const [ctlMsg, setCtlMsg] = useState<string | null>(null)
  const [keys, setKeys] = useState<AgencyKeyRow[]>([])
  const [newKey, setNewKey] = useState<string | null>(null)
  const [keyName, setKeyName] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [origin, setOrigin] = useState('')

  // Read after mount so the server and client renders match
  useEffect(() => { setOrigin(window.location.origin) }, [])

  const load = useCallback(async () => {
    const [a, k] = await Promise.all([fetch('/api/agency'), fetch('/api/agency/keys')])
    const agency = await a.json()
    setAgencyName(agency.name ?? '')
    setCtl({
      alert_email: agency.alert_email ?? '',
      webhook_url: agency.webhook_url ?? '',
      spike_multiplier: String(agency.spike_multiplier ?? 10),
      spike_floor_usd: String(agency.spike_floor_usd ?? 10),
      auto_approve_increase_usd: String(agency.auto_approve_increase_usd ?? 0),
    })
    setKeys(await k.json())
  }, [])

  useEffect(() => { load() }, [load])

  async function saveName() {
    setSavingName(true)
    await fetch('/api/agency', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: agencyName }) })
    setSavingName(false)
    router.refresh()
  }

  async function saveControls() {
    setSavingCtl(true)
    setCtlMsg(null)
    const res = await fetch('/api/agency', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alert_email: ctl.alert_email,
        webhook_url: ctl.webhook_url,
        spike_multiplier: Number(ctl.spike_multiplier),
        spike_floor_usd: Number(ctl.spike_floor_usd),
        auto_approve_increase_usd: Number(ctl.auto_approve_increase_usd),
      }),
    })
    const data = await res.json()
    setSavingCtl(false)
    setCtlMsg(res.ok ? 'Saved' : (data.error ?? 'Failed'))
  }

  async function mintKey() {
    setBusy(true)
    const res = await fetch('/api/agency/keys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: keyName || 'default' }) })
    const data = await res.json()
    setBusy(false)
    if (res.ok) { setNewKey(data.api_key); setKeyName(''); load() }
  }

  async function revoke(id: string) {
    if (!confirm('Revoke this agency key? Any agent using it loses management access.')) return
    await fetch(`/api/agency/keys/${id}`, { method: 'DELETE' })
    load()
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const active = keys.filter(k => !k.revoked_at)
  const revoked = keys.filter(k => k.revoked_at)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="serif text-4xl font-normal">Agency</h1>
      </div>

      <Card className="mb-6">
        <div className="px-5 py-4" style={{ borderBottom: '0.5px solid #e0ddd7' }}>
          <p className="text-sm font-medium text-ink">Agency name</p>
        </div>
        <CardContent className="flex gap-3 items-end">
          <div className="flex-1 max-w-sm">
            <Input value={agencyName} onChange={e => setAgencyName(e.target.value)} />
          </div>
          <Button size="sm" loading={savingName} onClick={saveName}>Save</Button>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <div className="px-5 py-4" style={{ borderBottom: '0.5px solid #e0ddd7' }}>
          <p className="text-sm font-medium text-ink">Alerts and controls</p>
          <p className="text-xs text-ink-muted">Where alerts go, when a key gets frozen, and how much an agent may raise a budget on its own.</p>
        </div>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input id="alert-email" label="Alert email" placeholder="Defaults to the owner's email" type="email" value={ctl.alert_email} onChange={e => setCtl({ ...ctl, alert_email: e.target.value })} />
          <Input id="webhook" label="Webhook URL (optional)" placeholder="https://hooks.example.com/keyone" value={ctl.webhook_url} onChange={e => setCtl({ ...ctl, webhook_url: e.target.value })} />
          <Input id="spike-mult" label="Freeze a key when its last hour is more than × its hourly average" type="number" min="1" step="0.5" value={ctl.spike_multiplier} onChange={e => setCtl({ ...ctl, spike_multiplier: e.target.value })} />
          <Input id="spike-floor" label="…and at least this much in the hour (USD)" type="number" min="0" step="1" value={ctl.spike_floor_usd} onChange={e => setCtl({ ...ctl, spike_floor_usd: e.target.value })} />
          <Input id="auto-approve" label="Auto-approve budget increases up to (USD, 0 = always ask)" type="number" min="0" step="1" value={ctl.auto_approve_increase_usd} onChange={e => setCtl({ ...ctl, auto_approve_increase_usd: e.target.value })} />
          <div className="flex items-end gap-3">
            <Button size="sm" loading={savingCtl} onClick={saveControls}>Save controls</Button>
            {ctlMsg && <span className="text-xs text-ink-muted pb-2">{ctlMsg}</span>}
          </div>
        </CardContent>
      </Card>

      {newKey && (
        <Card className="mb-6 p-5" style={{ borderColor: '#97C459' }}>
          <Badge variant="green" className="mb-3">Agency key issued</Badge>
          <p className="text-sm text-red-600 font-medium mb-3">Copy it now. It won&apos;t be shown again.</p>
          <div className="bg-ink rounded-lg p-4 mb-3">
            <code className="text-green-light text-sm break-all font-mono">{newKey}</code>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" size="sm" onClick={() => copy(newKey)}>{copied ? '✓ Copied' : 'Copy key'}</Button>
            <Button size="sm" onClick={() => setNewKey(null)}>Done</Button>
          </div>
        </Card>
      )}

      <Card className="mb-6">
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '0.5px solid #e0ddd7' }}>
          <div>
            <p className="text-sm font-medium text-ink">Agency keys</p>
            <p className="text-xs text-ink-muted">Let an agent create clients and projects, mint project keys, and read spend. They can&apos;t spend on their own or mint more agency keys.</p>
          </div>
          <div className="flex gap-2 items-center">
            <input
              className="px-3 py-1.5 bg-bg border rounded text-xs text-ink placeholder:text-ink-subtle outline-none focus:border-ink-muted"
              style={{ borderWidth: '0.5px', borderColor: '#e0ddd7' }}
              placeholder="Label, e.g. claude-code"
              value={keyName}
              onChange={e => setKeyName(e.target.value)}
            />
            <Button size="sm" loading={busy} onClick={mintKey}>New agency key</Button>
          </div>
        </div>
        {keys.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-ink-muted">No agency keys yet.</div>
        ) : (
          <div>
            {[...active, ...revoked].map((k, i, arr) => (
              <div key={k.id} className="px-5 py-3 flex items-center justify-between text-sm" style={i < arr.length - 1 ? { borderBottom: '0.5px solid #e0ddd7' } : undefined}>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-ink">{k.key_prefix}••••••••</span>
                  <Badge variant={k.revoked_at ? 'default' : 'green'}>{k.revoked_at ? 'Revoked' : 'Active'}</Badge>
                  <span className="text-xs text-ink-muted">{k.name}</span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-xs text-ink-muted">
                    {k.revoked_at ? `Revoked ${formatDate(k.revoked_at)}` : k.last_used_at ? `Last used ${formatDate(k.last_used_at)}` : 'Never used'}
                  </span>
                  {!k.revoked_at && <button onClick={() => revoke(k.id)} className="text-xs text-ink-muted hover:text-red-600 transition-colors">Revoke</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="px-5 py-4" style={{ borderBottom: '0.5px solid #e0ddd7' }}>
          <p className="text-sm font-medium text-ink">Connect an agent</p>
          <p className="text-xs text-ink-muted">Either line below gives Claude Code, Cursor, or any MCP client the ability to set up projects and read spend.</p>
        </div>
        <CardContent className="flex flex-col gap-4">
          <div>
            <p className="text-xs text-ink-muted mb-1.5">Skill (paste into the agent&apos;s chat)</p>
            <pre className="text-xs text-ink font-mono bg-bg rounded-lg p-3 overflow-x-auto" style={{ border: '0.5px solid #e0ddd7' }}>{`set up ${origin}/skill.md`}</pre>
          </div>
          <div>
            <p className="text-xs text-ink-muted mb-1.5">MCP server (Claude Code)</p>
            <pre className="text-xs text-ink font-mono bg-bg rounded-lg p-3 overflow-x-auto" style={{ border: '0.5px solid #e0ddd7' }}>{`claude mcp add --transport http keyone ${origin}/api/mcp \\
  --header "Authorization: Bearer kone_admin_…"`}</pre>
          </div>
          <div>
            <p className="text-xs text-ink-muted mb-1.5">SDKs (with a project key)</p>
            <pre className="text-xs text-ink font-mono bg-bg rounded-lg p-3 overflow-x-auto" style={{ border: '0.5px solid #e0ddd7' }}>{`OpenAI(base_url="${origin}/api/proxy/openai/v1", api_key="kone_live_…")
Anthropic(base_url="${origin}/api/proxy/anthropic", api_key="kone_live_…")`}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
