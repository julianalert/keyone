'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSignOut } from './useSignOut'

interface UserMenuProps {
  email: string
  name?: string
}

function initials(label: string) {
  const words = label.trim().split(/[\s@._-]+/).filter(Boolean)
  const letters = words.length > 1 ? words[0][0] + words[1][0] : label.slice(0, 2)
  return letters.toUpperCase()
}

export function UserMenu({ email, name }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const signOut = useSignOut()

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex items-center gap-2.5 pl-3 pr-1 py-1 rounded-full text-sm text-ink hover:bg-border/50 transition-colors"
      >
        {name && <span className="max-w-[16rem] truncate">{name}</span>}
        <span className="w-8 h-8 rounded-full bg-green-pale text-green-dark text-xs font-medium flex items-center justify-center">
          {initials(name || email)}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 bg-cream rounded-lg shadow-sm py-1 z-50"
          style={{ border: '0.5px solid #e0ddd7' }}
        >
          <div className="px-3 py-2" style={{ borderBottom: '0.5px solid #e0ddd7' }}>
            {name && <div className="text-sm text-ink truncate">{name}</div>}
            <div className="text-xs text-ink-subtle truncate">{email}</div>
          </div>
          <div className="p-1">
            <Link
              href="/dashboard/settings"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded text-sm text-ink-muted hover:text-ink hover:bg-border/50 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.25"/>
                <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
              </svg>
              Settings
            </Link>
            <button
              role="menuitem"
              onClick={signOut}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded text-sm text-ink-muted hover:text-ink hover:bg-border/50 transition-colors w-full"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
                <path d="M10.5 5l3 3-3 3M13.5 8H6" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
