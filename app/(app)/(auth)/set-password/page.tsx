'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

// Invited teammates land here from their invite link to choose a password.
export default function SetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [agency, setAgency] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/agency').then(r => (r.ok ? r.json() : null)).then(d => setAgency(d?.name ?? null)).catch(() => {})
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { createClient } = await import('@/lib/supabase/client')
    const { error } = await createClient().auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <Link href="/" className="logo text-2xl">key<span className="dot">.</span>one</Link>
        <p className="mt-2 text-sm text-ink-muted">{agency ? `You've joined ${agency}.` : 'Welcome.'} Choose a password to finish.</p>
      </div>
      <div className="card p-6">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Input id="password" label="Password" type="password" placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" autoFocus />
          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded border border-red-100">{error}</p>}
          <Button type="submit" loading={loading} className="w-full mt-1" size="lg">Continue</Button>
        </form>
      </div>
    </div>
  )
}
