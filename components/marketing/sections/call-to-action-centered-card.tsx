import { clsx } from 'clsx/lite'
import type { ComponentProps, ReactNode } from 'react'
import { Container } from '../elements/container'

export function CallToActionCenteredCard({
  headline,
  subheadline,
  cta,
  className,
  ...props
}: {
  headline: ReactNode
  subheadline?: ReactNode
  cta?: ReactNode
} & ComponentProps<'section'>) {
  return (
    <section className={clsx('py-16', className)} {...props}>
      <Container>
        <div className="flex flex-col items-center gap-10 rounded-xl bg-olive-950 px-6 py-16 text-center sm:px-10 sm:py-24 dark:bg-white/5 dark:inset-ring-1 dark:inset-ring-white/10">
          <div className="flex flex-col items-center gap-6">
            <h2 className="max-w-4xl font-display text-[2rem]/10 tracking-tight text-balance text-white sm:text-5xl/14">
              {headline}
            </h2>
            {subheadline && (
              <div className="flex max-w-2xl flex-col gap-4 text-base/7 text-pretty text-olive-300 dark:text-olive-400">
                {subheadline}
              </div>
            )}
          </div>
          {cta}
        </div>
      </Container>
    </section>
  )
}
