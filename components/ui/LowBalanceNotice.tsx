'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { formatUSD } from '@/lib/utils'

const LOW_USD = 5

// Shown in the top bar on every page while the wallet is low.
export function LowBalanceNotice() {
  const pathname = usePathname()
  const [balance, setBalance] = useState<number | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/wallet', { cache: 'no-store' })
      if (res.ok) setBalance(Number((await res.json()).balance_usd ?? 0))
    } catch {
      // keep the last value
    }
  }, [])

  useEffect(() => { load() }, [load, pathname])
  useEffect(() => {
    const t = setInterval(load, 60_000)
    return () => clearInterval(t)
  }, [load])

  if (balance === null || balance >= LOW_USD) return null
  const critical = balance < 1

  return (
    <Link
      href="/dashboard/wallet"
      className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-opacity hover:opacity-90"
      style={critical
        ? { background: '#FEF2F2', color: '#B91C1C', border: '0.5px solid #FCA5A5' }
        : { background: '#FFF4E5', color: '#9A5B00', border: '0.5px solid #F5C77E' }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'currentColor' }} />
      <span>
        <span className="font-medium">{critical ? 'Wallet almost empty' : 'Wallet balance is low'}</span>
        <span className="hidden sm:inline"> · {formatUSD(balance, 2)} left. Every project key stops working at $0.</span>
      </span>
      <span className="font-medium">Top up →</span>
    </Link>
  )
}
