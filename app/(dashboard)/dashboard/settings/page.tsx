'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'

interface MemberRow { user_id: string; email: string | null; role: string; joined_at: string; is_you: boolean }

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
  const [ownerEmail, setOwnerEmail] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [ctl, setCtl] = useState({ alert_email: '', webhook_url: '', spike_multiplier: '10', spike_floor_usd: '10', auto_approve_increase_usd: '0' })
  const [savingCtl, setSavingCtl] = useState(false)
  const [ctlMsg, setCtlMsg] = useState<string | null>(null)
  const [keys, setKeys] = useState<AgencyKeyRow[]>([])
  const [members, setMembers] = useState<MemberRow[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member')
  const [inviting, setInviting] = useState(false)
  const [inviteMsg, setInviteMsg] = useState<string | null>(null)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [keyName, setKeyName] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [origin, setOrigin] = useState('')

  // Read after mount so the server and client renders match
  useEffect(() => { setOrigin(window.location.origin) }, [])

  const load = useCallback(async () => {
    const [a, k, m] = await Promise.all([fetch('/api/agency'), fetch('/api/agency/keys'), fetch('/api/agency/members')])
    const agency = await a.json()
    setMembers(m.ok ? await m.json() : [])
    setAgencyName(agency.name ?? '')
    setOwnerEmail(agency.owner_email ?? '')
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

  async function invite() {
    setInviting(true); setInviteMsg(null)
    const res = await fetch('/api/agency/members', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: inviteEmail, role: inviteRole }) })
    const d = await res.json()
    setInviting(false)
    setInviteMsg(res.ok ? (d.status === 'added' ? `${d.email} added to the team.` : `Invite sent to ${d.email}.`) : (d.error ?? 'Invite failed'))
    if (res.ok) { setInviteEmail(''); load() }
  }

  async function setRole(userId: string, role: 'admin' | 'member') {
    await fetch(`/api/agency/members/${userId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) })
    load()
  }

  async function removeMember(userId: string, email: string | null) {
    if (!confirm(`Remove ${email ?? 'this member'} from the team?`)) return
    await fetch(`/api/agency/members/${userId}`, { method: 'DELETE' })
    load()
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
          <p className="text-sm font-medium text-ink">Agency</p>
          <p className="text-xs text-ink-muted">The name your clients and agents see, and the account that owns it.</p>
        </div>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Input id="agency-name" label="Agency name" value={agencyName} onChange={e => setAgencyName(e.target.value)} />
          <Input id="owner-email" label="Owner" value={ownerEmail} readOnly className="text-ink-muted cursor-default" />
          <Button size="md" loading={savingName} onClick={saveName}>Save</Button>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <div className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap" style={{ borderBottom: '0.5px solid #e0ddd7' }}>
          <div>
            <p className="text-sm font-medium text-ink">Team</p>
            <p className="text-xs text-ink-muted">Everyone here sees every client and project. Admins can also invite and remove people.</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              className="px-3 py-1.5 bg-bg border rounded text-xs text-ink placeholder:text-ink-subtle outline-none focus:border-ink-muted w-52"
              style={{ borderWidth: '0.5px', borderColor: '#e0ddd7' }}
              placeholder="colleague@agency.com"
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
            />
            <select value={inviteRole} onChange={e => setInviteRole(e.target.value as 'member' | 'admin')} className="px-2 py-1.5 bg-bg border rounded text-xs text-ink outline-none" style={{ borderWidth: '0.5px', borderColor: '#e0ddd7' }}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <Button size="sm" loading={inviting} onClick={invite} disabled={!inviteEmail}>Invite</Button>
          </div>
        </div>
        {inviteMsg && <p className="px-5 pt-3 text-xs text-ink-muted">{inviteMsg}</p>}
        <div>
          {members.map((m, i) => (
            <div key={m.user_id} className="px-5 py-3 flex items-center justify-between text-sm" style={i < members.length - 1 ? { borderBottom: '0.5px solid #e0ddd7' } : undefined}>
              <div className="flex items-center gap-3">
                <span className="text-ink">{m.email ?? m.user_id}</span>
                {m.is_you && <span className="text-2xs text-ink-subtle">you</span>}
                <Badge variant={m.role === 'owner' ? 'green' : 'default'}>{m.role}</Badge>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-ink-muted">Joined {formatDate(m.joined_at)}</span>
                {m.role !== 'owner' && !m.is_you && (
                  <>
                    <button onClick={() => setRole(m.user_id, m.role === 'admin' ? 'member' : 'admin')} className="text-ink-muted hover:text-ink">{m.role === 'admin' ? 'Make member' : 'Make admin'}</button>
                    <button onClick={() => removeMember(m.user_id, m.email)} className="text-ink-muted hover:text-red-600">Remove</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
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
            <Button size="md" loading={savingCtl} onClick={saveControls}>Save controls</Button>
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
