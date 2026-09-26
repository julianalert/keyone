'use client'

import { useRouter } from 'next/navigation'

export function useSignOut() {
  const router = useRouter()

  return async function signOut() {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }
}
