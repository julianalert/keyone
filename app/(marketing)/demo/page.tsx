import Image from 'next/image'
import { AnnouncementBadge } from '@/components/marketing/elements/announcement-badge'
import { Container } from '@/components/marketing/elements/container'
import { Heading } from '@/components/marketing/elements/heading'
import { Main } from '@/components/marketing/elements/main'
import { pageMetadata } from '../seo'

export const metadata = pageMetadata({
  title: 'Book a demo',
  description:
    'Book a free 30-minute call with keyone’s founder. We talk about your agency and your clients, and you leave with a plan for tracking and controlling their AI spend.',
  path: '/demo',
})

const CALENDLY_URL = 'https://calendly.com/juliend-visionbds/30min'

// Inline Calendly embed. Plain iframe, so no third-party script runs on the page.
const embedUrl = `${CALENDLY_URL}?${new URLSearchParams({
  hide_gdpr_banner: '1',
  primary_color: '3b6d11',
})}`

// What the visitor gets from the call: bold lead, then the detail
const takeaways = [
  {
    lead: 'You walk us through your agency',
    detail: ': your clients, the tools each one uses, and where the API keys live today.',
  },
  {
    lead: 'We find where spend escapes you',
    detail: ': shared keys, workflows with no limit, the month-end spreadsheet that never quite adds up.',
  },
  {
    lead: 'You leave with a plan',
    detail: ', whether you sign up or not: which client to connect first, which budgets to set, and what it would cost.',
  },
]

const people = [
  { name: 'Julien Devoir', img: '/julian.jpg' },
  { name: 'Carine', img: '/carine.jpeg' },
]

export default function DemoPage() {
  return (
    <Main>
      <section id="demo" className="py-16">
        <Container className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] lg:gap-16">
          <div className="flex flex-col gap-6">
            <nav aria-label="Breadcrumb" className="text-sm/7 text-olive-500">
              <a href="/" className="hover:text-olive-950 dark:hover:text-white">
                Home
              </a>
              <span aria-hidden="true" className="mx-2">
                ›
              </span>
              <span className="text-olive-950 dark:text-white">Book a demo</span>
            </nav>

            <AnnouncementBadge href="#calendar" text="Free call · 30 minutes" cta="Pick a time" className="self-start" />

            <Heading className="text-5xl/12 sm:text-6xl/16">
              Book a <span className="text-brand-green italic dark:text-brand-lime">demo.</span>
            </Heading>

            <p className="text-lg/8 text-olive-700 dark:text-olive-400">
              We talk about your agency’s daily processes, you leave knowing what your clients’ AI really costs you, and
              whether keyone is worth it for you.
            </p>

            <ul className="flex flex-col gap-4 text-base/7 text-olive-700 dark:text-olive-400">
              {takeaways.map(t => (
                <li key={t.lead} className="flex gap-3">
                  <span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-md bg-brand-green dark:bg-brand-lime">
                    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="size-3.5 stroke-white dark:stroke-olive-950">
                      <path d="M3.5 8.5l3 3 6-6.5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <p>
                    <strong className="font-medium text-olive-950 dark:text-white">{t.lead}</strong>
                    {t.detail}
                  </p>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-4 border-t border-olive-950/10 pt-6 dark:border-white/10">
              <div className="flex shrink-0 -space-x-2">
                {people.map(p => (
                  <Image
                    key={p.name}
                    src={p.img}
                    alt={p.name}
                    width={48}
                    height={48}
                    className="size-12 rounded-full object-cover ring-2 ring-olive-100 dark:ring-olive-950"
                  />
                ))}
              </div>
              <p className="text-sm/6 text-olive-700 dark:text-olive-400">
                You’ll talk with Julien, who founded keyone with Carine after running AI for his own agency’s clients.{' '}
                <a href="/about" className="font-medium text-brand-green dark:text-brand-lime">
                  Who we are
                </a>
              </p>
            </div>
          </div>

          <div id="calendar" className="flex scroll-mt-24 flex-col gap-3">
            <div className="overflow-hidden rounded-xl bg-white ring-1 ring-olive-950/10 dark:ring-white/10">
              <iframe src={embedUrl} title="Book a 30-minute call with keyone" className="h-[720px] w-full" />
            </div>
            <p className="text-center text-sm/7 text-olive-500">
              Rather try it on your own?{' '}
              <a href="/signup" className="font-medium text-brand-green dark:text-brand-lime">
                Start with one client project
              </a>
              , no subscription.
            </p>
            <p className="text-center text-xs/6 text-olive-500">
              Calendar not loading?{' '}
              <a href={CALENDLY_URL} className="underline">
                Open it on Calendly
              </a>
            </p>
          </div>
        </Container>
      </section>
    </Main>
  )
}
