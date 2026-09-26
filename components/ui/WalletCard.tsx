'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { formatUSD } from '@/lib/utils'

// Thresholds: orange when a top-up is due, red when calls are about to stop.
const LOW_USD = 5
const CRITICAL_USD = 1

export function WalletCard() {
  const pathname = usePathname()
  const [balance, setBalance] = useState<number | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/wallet', { cache: 'no-store' })
      if (res.ok) setBalance(Number((await res.json()).balance_usd ?? 0))
    } catch {
      // keep the last known value
    }
  }, [])

  // Refresh on every navigation and once a minute while the tab is open
  useEffect(() => { load() }, [load, pathname])
  useEffect(() => {
    const t = setInterval(load, 60_000)
    return () => clearInterval(t)
  }, [load])

  const level = balance === null ? 'ok' : balance < CRITICAL_USD ? 'critical' : balance < LOW_USD ? 'low' : 'ok'
  const palette = {
    ok:       { bg: '#EAF3DE', border: '#C0DD97', label: '#3B6D11', amount: '#1a1a18', note: 'Available balance' },
    low:      { bg: '#FFF4E5', border: '#F5C77E', label: '#9A5B00', amount: '#7A4600', note: 'Running low' },
    critical: { bg: '#FEF2F2', border: '#FCA5A5', label: '#B91C1C', amount: '#991B1B', note: 'Keys stop at $0' },
  }[level]

  return (
    <Link
      href="/dashboard/wallet"
      className="block rounded-lg px-3.5 py-3 transition-opacity hover:opacity-90"
      style={{ background: palette.bg, border: `0.5px solid ${palette.border}` }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="flex items-center gap-1.5 text-2xs uppercase tracking-wider font-medium" style={{ color: palette.label }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="1" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.25"/>
            <path d="M1 7h14" stroke="currentColor" strokeWidth="1.25"/>
            <path d="M3 2h10" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
            <circle cx="11.5" cy="11" r="1" fill="currentColor"/>
          </svg>
          Wallet
        </span>
        {level !== 'ok' && (
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: palette.label }} />
        )}
      </div>
      <p className="serif text-2xl leading-tight" style={{ color: palette.amount }}>
        {balance === null ? '—' : formatUSD(balance, 2)}
      </p>
      <p className="text-2xs mt-1" style={{ color: palette.label }}>{palette.note}</p>
    </Link>
  )
}
