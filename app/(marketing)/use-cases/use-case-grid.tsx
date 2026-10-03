import { ArrowNarrowRightIcon } from '@/components/marketing/icons/arrow-narrow-right-icon'
import { useCases, type UseCaseContent } from './use-cases'

/* Cards linking to the use-case pages, shared by the home page and /use-cases. */
export function UseCaseGrid({
  items = useCases,
  headingLevel = 'h3',
  columns = 4,
}: {
  items?: UseCaseContent[]
  headingLevel?: 'h2' | 'h3'
  columns?: 3 | 4
}) {
  const H = headingLevel
  return (
    <ul className={columns === 4 ? 'grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4' : 'grid grid-cols-1 gap-2 sm:grid-cols-3'}>
      {items.map(u => (
        <li key={u.slug} className="flex">
          <a
            href={`/use-cases/${u.slug}`}
            className="group flex flex-1 flex-col gap-3 rounded-xl bg-white p-6 ring-1 ring-olive-950/5 transition-shadow hover:shadow-lg hover:shadow-olive-950/5 dark:bg-white/5 dark:ring-white/10"
          >
            <span className="flex size-10 items-center justify-center rounded-lg bg-brand-lime/20 text-brand-green dark:bg-brand-lime/15 dark:text-brand-lime">
              {u.icon}
            </span>
            <H className="mt-2 text-base/7 font-medium text-olive-950 dark:text-white">{u.name}</H>
            <p className="flex-1 text-sm/7 text-olive-700 dark:text-olive-400">{u.tagline}</p>
            <span className="inline-flex items-center gap-2 text-sm/7 font-medium text-olive-950 dark:text-white">
              See how <ArrowNarrowRightIcon className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}
