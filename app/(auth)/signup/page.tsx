'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function SignupPage() {
  const router = useRouter()
  const [agencyName, setAgencyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { agency_name: agencyName.trim() },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Email confirmation disabled: Supabase returns a session right away
    if (data.session) {
      router.push('/dashboard')
      router.refresh()
      return
    }

    // An existing, already-confirmed email comes back with no identities
    if (data.user && data.user.identities?.length === 0) {
      setError('An account with this email already exists. Sign in instead.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="mb-8">
          <Link href="/" className="logo text-2xl">
            key<span className="dot">.</span>one
          </Link>
        </div>
        <div className="card p-8">
          <div className="text-3xl mb-4">✉️</div>
          <h2 className="serif text-2xl mb-2">Check your email</h2>
          <p className="text-sm text-ink-muted">
            We sent a confirmation link to <strong>{email}</strong>.
            Click it to activate your account.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="mb-8 text-center">
        <Link href="/" className="logo text-2xl">
          key<span className="dot">.</span>one
        </Link>
        <p className="mt-2 text-sm text-ink-muted">Create your agency account. Start with $3 of credit.</p>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <Input
            id="agency-name"
            label="Agency name"
            placeholder="Northwind Studio"
            value={agencyName}
            onChange={e => setAgencyName(e.target.value)}
            required
            autoComplete="organization"
          />
          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            id="password"
            label="Password"
            type="password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />

          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded border border-red-100">
              {error}
            </p>
          )}

          <Button type="submit" loading={loading} className="w-full mt-1" size="lg">
            Create account
          </Button>
        </form>
      </div>

      <p className="mt-4 text-center text-sm text-ink-muted">
        Already have an account?{' '}
        <Link href="/login" className="text-ink underline-offset-2 hover:underline">
          Sign in
        </Link>
      </p>

      <p className="mt-6 text-center text-xs text-ink-subtle">
        $3 free credit to start. Then pay only for what you use. No subscription, ever.
      </p>
    </div>
  )
}
