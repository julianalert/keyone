'use client'

import { clsx } from 'clsx/lite'
import { useEffect, useState } from 'react'

export interface TocItem {
  id: string
  text: string
}

// "On this page" navigation. Links are plain anchors (crawlable, work without
// JS); on the client the section currently being read is highlighted.
export function TableOfContents({ items, className }: { items: TocItem[]; className?: string }) {
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    const headings = items
      .map(item => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null)
    if (headings.length === 0) return

    let frame = 0
    const update = () => {
      frame = 0
      const offset = window.innerHeight * 0.25
      let current: string | null = null
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top <= offset) current = heading.id
        else break
      }
      setActiveId(current)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [items])

  return (
    <nav aria-label="On this page" className={className}>
      <p className="text-sm/7 font-semibold text-olive-950 dark:text-white">On this page</p>
      <ol className="mt-3 flex flex-col border-l border-olive-950/10 dark:border-white/10">
        {items.map(item => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={activeId === item.id ? 'location' : undefined}
              className={clsx(
                '-ml-px block border-l-2 py-1.5 pl-4 text-sm/6 transition-colors',
                activeId === item.id
                  ? 'border-brand-green font-medium text-olive-950 dark:border-brand-lime dark:text-white'
                  : 'border-transparent text-olive-600 hover:border-olive-950/20 hover:text-olive-950 dark:text-olive-400 dark:hover:border-white/20 dark:hover:text-white',
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
