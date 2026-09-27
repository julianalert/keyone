import type { Metadata } from 'next'
import Image from 'next/image'
import { Container } from '@/components/marketing/elements/container'
import { Heading } from '@/components/marketing/elements/heading'
import { Main } from '@/components/marketing/elements/main'
import { Text } from '@/components/marketing/elements/text'
import { ArrowNarrowRightIcon } from '@/components/marketing/icons/arrow-narrow-right-icon'
import { StartFreeCallToAction } from '../start-free-cta'
import { formatGuideDate, getAllGuides } from './guides'

export const metadata: Metadata = {
  title: 'Guides | keyone',
  description: 'Practical guides for agencies running AI for their clients: tracking costs, setting budgets and billing usage.',
  alternates: { canonical: '/guides' },
}

export default function GuidesPage() {
  const guides = getAllGuides()

  return (
    <Main>
      <section className="py-16">
        <Container className="flex flex-col gap-10 sm:gap-16">
          <div className="flex max-w-2xl flex-col gap-6">
            <Heading>Guides</Heading>
            <Text size="lg" className="flex flex-col gap-4">
              <p>Practical guides for agencies running AI for their clients: tracking costs, setting budgets and billing usage.</p>
            </Text>
          </div>

          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
            {guides.map(guide => (
              <li key={guide.slug} className="flex">
                <a
                  href={`/guides/${guide.slug}`}
                  className="group flex flex-1 flex-col gap-4 rounded-xl bg-white p-6 ring-1 ring-olive-950/5 transition-shadow hover:shadow-lg hover:shadow-olive-950/5 dark:bg-white/5 dark:ring-white/10"
                >
                  <p className="text-sm/6 text-olive-500">
                    <time dateTime={guide.published}>{formatGuideDate(guide.published)}</time> · {guide.readingMinutes} min
                    read
                  </p>
                  <h2 className="font-display text-3xl/9 tracking-tight text-balance text-olive-950 dark:text-white">
                    {guide.title}
                  </h2>
                  <p className="flex-1 text-sm/7 text-olive-700 dark:text-olive-400">{guide.description}</p>
                  <div className="flex items-center justify-between gap-4 border-t border-olive-950/10 pt-4 dark:border-white/10">
                    <span className="flex items-center gap-2.5 text-sm/6 font-medium text-olive-950 dark:text-white">
                      {guide.authorImage ? (
                        <Image
                          src={guide.authorImage}
                          alt=""
                          width={56}
                          height={56}
                          className="size-7 rounded-full object-cover outline -outline-offset-1 outline-black/5 dark:outline-white/10"
                        />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="flex size-7 items-center justify-center rounded-full bg-olive-950 font-display text-base text-white dark:bg-white dark:text-olive-950"
                        >
                          {guide.author.charAt(0).toLowerCase()}
                        </span>
                      )}
                      {guide.author}
                    </span>
                    <span className="inline-flex items-center gap-2 text-sm/7 font-medium text-olive-950 dark:text-white">
                      Read <ArrowNarrowRightIcon className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </Container>
      </section>
      <StartFreeCallToAction />
    </Main>
  )
}
