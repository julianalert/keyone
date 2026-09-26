'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { WalletCard } from './WalletCard'

const navItems = [
  {
    href: '/dashboard',
    label: 'Overview',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.25"/>
        <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.25"/>
        <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.25"/>
        <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.25"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/clients',
    label: 'Clients',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="5.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.25"/>
        <circle cx="11" cy="6" r="2" stroke="currentColor" strokeWidth="1.25"/>
        <path d="M1.5 13c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
        <path d="M10 13c0-1.7 1.3-3 3-3s2 1.3 2 3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/catalog',
    label: 'Catalog',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.25"/>
        <path d="M4 15h8M8 11v4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/reports',
    label: 'Reports',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 13.5h12" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
        <rect x="3" y="7" width="2.5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.25"/>
        <rect x="6.75" y="3" width="2.5" height="9" rx="0.5" stroke="currentColor" strokeWidth="1.25"/>
        <rect x="10.5" y="5.5" width="2.5" height="6.5" rx="0.5" stroke="currentColor" strokeWidth="1.25"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/controller',
    label: 'Controller',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.25"/>
        <path d="M8 5v3l2 1.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-52 h-screen shrink-0 bg-bg flex flex-col" style={{ borderRight: '0.5px solid #e0ddd7' }}>
      {/* Logo */}
      <div className="h-14 shrink-0 px-5 flex items-center" style={{ borderBottom: '0.5px solid #e0ddd7' }}>
        <Link href="/dashboard" className="logo text-xl">
          key<span className="dot">.</span>one
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-0.5">
        {navItems.map(item => {
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href) ||
              (item.href === '/dashboard/clients' && pathname.startsWith('/dashboard/projects'))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-2 rounded text-sm transition-colors',
                isActive
                  ? 'bg-ink text-bg'
                  : 'text-ink-muted hover:text-ink hover:bg-border/50'
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Wallet */}
      <div className="px-3 pb-4 pt-3" style={{ borderTop: '0.5px solid #e0ddd7' }}>
        <WalletCard />
      </div>
    </aside>
  )
}
