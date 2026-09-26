import { redirect } from 'next/navigation'
import { getSessionContext } from '@/lib/agency'
import { FirstRun } from '@/components/onboarding/FirstRun'

export const dynamic = 'force-dynamic'

// /onboarding — the guided first run, on its own screen
export default async function OnboardingPage() {
  const ctx = await getSessionContext()
  if (!ctx) redirect('/login')
  const { data: agency } = await ctx.supabase.from('agencies').select('name').eq('id', ctx.agencyId).single()
  return <FirstRun agencyName={agency?.name ?? 'your agency'} />
}
