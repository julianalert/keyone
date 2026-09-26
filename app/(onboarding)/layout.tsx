import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Minimal chrome for the guided setup: no sidebar, no dashboard bars.
export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="h-14 shrink-0 px-6 flex items-center justify-between" style={{ borderBottom: '0.5px solid #e0ddd7' }}>
        <Link href="/dashboard" className="logo text-xl">key<span className="dot">.</span>one</Link>
        <Link href="/dashboard/clients" className="text-xs text-ink-muted hover:text-ink">Skip, I&apos;ll explore →</Link>
      </header>
      <main className="flex-1 flex justify-center">
        {children}
      </main>
    </div>
  )
}
