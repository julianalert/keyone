import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isPlatformAdmin } from '@/lib/platform'

// Platform owner area. Not linked from any agency page; 404 for everyone else.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!isPlatformAdmin(user.email)) notFound()

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="h-14 shrink-0 px-6 flex items-center justify-between" style={{ borderBottom: '0.5px solid #e0ddd7' }}>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="logo text-xl">key<span className="dot">.</span>one</Link>
          <span className="text-2xs uppercase tracking-wider px-2 py-0.5 rounded bg-ink text-bg">Platform</span>
        </div>
        <Link href="/dashboard" className="text-xs text-ink-muted hover:text-ink">← Back to dashboard</Link>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
