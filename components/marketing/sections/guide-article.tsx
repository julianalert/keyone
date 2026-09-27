import { clsx } from 'clsx/lite'
import type { ComponentProps, ReactNode } from 'react'
import { ArticleProse } from '../elements/article-prose'
import { Container } from '../elements/container'
import { TableOfContents, type TocItem } from '../elements/table-of-contents'
import { ArrowNarrowLeftIcon } from '../icons/arrow-narrow-left-icon'

// Three-column grid: sticky "On this page" menu on the left, a centered
// reading column, and an empty right column that keeps the text centered.
const grid = 'grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,42rem)_minmax(0,1fr)] lg:gap-x-12'

export function GuideArticle({
  backLink,
  eyebrow,
  headline,
  subheadline,
  meta,
  toc,
  html,
  className,
  ...props
}: {
  backLink?: { href: string; label: ReactNode }
  eyebrow?: ReactNode
  headline: ReactNode
  subheadline?: ReactNode
  meta?: ReactNode
  toc: TocItem[]
  html: string
} & ComponentProps<'article'>) {
  return (
    <article className={clsx('py-16', className)} {...props}>
      <Container>
        <header className={grid}>
          <div className="flex flex-col gap-6 lg:col-start-2">
            {backLink && (
              <a
                href={backLink.href}
                className="inline-flex items-center gap-2 self-start text-sm/7 font-medium text-olive-700 hover:text-olive-950 dark:text-olive-400 dark:hover:text-white"
              >
                <ArrowNarrowLeftIcon /> {backLink.label}
              </a>
            )}
            {eyebrow && <div className="text-sm/7 font-semibold text-olive-700 dark:text-olive-400">{eyebrow}</div>}
            <h1 className="font-display text-[2.5rem]/12 tracking-tight text-balance text-olive-950 sm:text-6xl/18 dark:text-white">
              {headline}
            </h1>
            {subheadline && (
              <div className="text-xl/8 text-pretty text-olive-600 sm:text-2xl/9 dark:text-olive-400">{subheadline}</div>
            )}
            {meta && (
              <div className="mt-2 flex items-center gap-3 border-y border-olive-950/10 py-4 text-sm/6 text-olive-600 dark:border-white/10 dark:text-olive-400">
                {meta}
              </div>
            )}
          </div>
        </header>

        <div className={clsx(grid, 'mt-10 sm:mt-14')}>
          {toc.length > 0 && (
            <aside className="max-lg:hidden">
              <TableOfContents
                items={toc}
                className="sticky top-[calc(var(--scroll-padding-top)+2rem)] ml-auto max-h-[calc(100vh-var(--scroll-padding-top)-4rem)] max-w-60 overflow-y-auto"
              />
            </aside>
          )}

          <div className="lg:col-start-2">
            {toc.length > 0 && (
              <details className="group mb-10 rounded-lg bg-olive-950/2.5 px-5 py-4 lg:hidden dark:bg-white/5">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm/7 font-semibold text-olive-950 dark:text-white [&::-webkit-details-marker]:hidden">
                  On this page
                  <span className="text-olive-500 transition-transform group-open:rotate-45" aria-hidden="true">
                    +
                  </span>
                </summary>
                <ol className="mt-3 flex flex-col gap-2 text-sm/6 text-olive-700 dark:text-olive-400">
                  {toc.map(item => (
                    <li key={item.id}>
                      <a href={`#${item.id}`} className="hover:text-olive-950 dark:hover:text-white">
                        {item.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </details>
            )}

            <ArticleProse dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        </div>
      </Container>
    </article>
  )
}
