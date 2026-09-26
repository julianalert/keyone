import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/ui/Sidebar'
import { UserMenu } from '@/components/ui/UserMenu'
import { LowBalanceNotice } from '@/components/ui/LowBalanceNotice'
import { headers } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/server'
import { sendWelcomeIfNeeded } from '@/lib/onboarding'
import { isPlatformAdmin } from '@/lib/platform'
import Link from 'next/link'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: membership } = await supabase
    .from('agency_members')
    .select('agency_id, agencies(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  const agency = membership?.agencies as { name: string } | { name: string }[] | null | undefined
  const agencyName = (Array.isArray(agency) ? agency[0]?.name : agency?.name) ?? user.user_metadata?.agency_name

  // Welcome email, once, on the first dashboard visit. Never blocks the page.
  if (membership?.agency_id && user.email) {
    const h = headers()
    const origin = `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3001'}`
    void sendWelcomeIfNeeded(createServiceClient(), membership.agency_id, user.email, origin).catch(() => {})
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 shrink-0 px-8 flex items-center justify-between gap-4" style={{ borderBottom: '0.5px solid #e0ddd7' }}>
          <LowBalanceNotice />
          <div className="ml-auto flex items-center gap-4">
            {isPlatformAdmin(user.email) && (
              <Link href="/admin" className="text-2xs uppercase tracking-wider px-2 py-1 rounded bg-ink text-bg hover:opacity-80">Platform</Link>
            )}
            <UserMenu email={user.email ?? ''} name={agencyName} />
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
