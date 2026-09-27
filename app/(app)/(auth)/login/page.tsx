'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Create client inside handler to avoid build-time env check
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="mb-8 text-center">
        <Link href="/" className="logo text-2xl">
          key<span className="dot">.</span>one
        </Link>
        <p className="mt-2 text-sm text-ink-muted">Sign in to your account</p>
      </div>

      <div className="card p-6">
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded border border-red-100">
              {error}
            </p>
          )}

          <Button type="submit" loading={loading} className="w-full mt-1" size="lg">
            Sign in
          </Button>
        </form>
      </div>

      <p className="mt-4 text-center text-sm text-ink-muted">
        No account?{' '}
        <Link href="/signup" className="text-ink underline-offset-2 hover:underline">
          Create one
        </Link>
      </p>
    </div>
  )
}
