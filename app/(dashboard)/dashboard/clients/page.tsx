'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatUSD } from '@/lib/utils'

interface ClientRow {
  id: string
  name: string
  rebill_markup_pct: number
  monthly_budget_usd: number | null
  is_active: boolean
  created_at: string
  project_count: number
  month_spend_usd: number
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const fetchClients = useCallback(async () => {
    const res = await fetch('/api/clients')
    setClients(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchClients() }, [fetchClients])

  const active = clients.filter(c => c.is_active)
  const inactive = clients.filter(c => !c.is_active)

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="section-label">Clients</p>
          <h1 className="serif text-4xl font-normal">Your Clients</h1>
        </div>
        <Button onClick={() => setShowCreate(true)} size="md">New client</Button>
      </div>

      {showCreate && (
        <CreateClientModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchClients() }}
        />
      )}

      {loading ? (
        <div className="text-sm text-ink-muted">Loading...</div>
      ) : clients.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-3xl mb-4">🏢</div>
          <h3 className="serif text-2xl font-normal mb-2">No clients yet</h3>
          <p className="text-sm text-ink-muted mb-6 max-w-sm mx-auto">
            Each client is a cost center. Add one, then create projects under it. Every project gets a single key that works for every tool in the catalog.
          </p>
          <Button onClick={() => setShowCreate(true)}>Add your first client</Button>
        </Card>
      ) : (
        <>
          <Card>
            <div className="px-5 py-2 grid grid-cols-12 gap-4 text-2xs text-ink-subtle uppercase tracking-wider" style={{ borderBottom: '0.5px solid #e0ddd7' }}>
              <span className="col-span-5">Client</span>
              <span className="col-span-2">Projects</span>
              <span className="col-span-2">Markup</span>
              <span className="col-span-3 text-right">Spend this month</span>
            </div>
            {active.map((client, i) => (
              <ClientRowView key={client.id} client={client} isLast={i === active.length - 1} />
            ))}
          </Card>
          {inactive.length > 0 && (
            <div className="mt-6">
              <p className="text-xs text-ink-subtle uppercase tracking-wider mb-2">Inactive</p>
              <Card>
                {inactive.map((client, i) => (
                  <ClientRowView key={client.id} client={client} isLast={i === inactive.length - 1} />
                ))}
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ClientRowView({ client, isLast }: { client: ClientRow; isLast: boolean }) {
  return (
    <Link
      href={`/dashboard/clients/${client.id}`}
      className="px-5 py-4 grid grid-cols-12 gap-4 items-center hover:bg-border/20 transition-colors text-sm"
      style={!isLast ? { borderBottom: '0.5px solid #e0ddd7' } : undefined}
    >
      <div className="col-span-5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-green-pale flex items-center justify-center text-base">🏢</div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-ink">{client.name}</span>
            {!client.is_active && <Badge variant="default">Inactive</Badge>}
          </div>
          {client.monthly_budget_usd && (
            <p className="text-xs text-ink-subtle">Budget {formatUSD(client.monthly_budget_usd, 2)}/mo</p>
          )}
        </div>
      </div>
      <span className="col-span-2 text-ink-muted">{client.project_count}</span>
      <span className="col-span-2 text-ink-muted">{Number(client.rebill_markup_pct) > 0 ? `+${client.rebill_markup_pct}%` : '—'}</span>
      <span className="col-span-3 text-right font-medium text-green-dark">{formatUSD(client.month_spend_usd, 4)}</span>
    </Link>
  )
}

function CreateClientModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [markup, setMarkup] = useState('')
  const [budget, setBudget] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        rebill_markup_pct: markup ? Number(markup) : 0,
        monthly_budget_usd: budget ? Number(budget) : null,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to create client')
      setLoading(false)
      return
    }
    onCreated()
  }

  return (
    <div className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="serif text-2xl font-normal">New client</h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink text-lg leading-none">×</button>
        </div>
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input id="client-name" label="Client name" placeholder="Acme Corp" value={name} onChange={e => setName(e.target.value)} required autoFocus />
          <Input id="client-markup" label="Rebill markup % (optional)" type="number" placeholder="20" value={markup} onChange={e => setMarkup(e.target.value)} min="0" step="0.5" />
          <Input id="client-budget" label="Monthly budget cap (optional)" type="number" placeholder="500.00" value={budget} onChange={e => setBudget(e.target.value)} min="0" step="0.01" />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-3 mt-1">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" loading={loading} className="flex-1">Create client</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
