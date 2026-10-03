import { Container } from '@/components/marketing/elements/container'
import { Heading } from '@/components/marketing/elements/heading'
import { Main } from '@/components/marketing/elements/main'
import { Text } from '@/components/marketing/elements/text'
import { ArrowNarrowRightIcon } from '@/components/marketing/icons/arrow-narrow-right-icon'
import { Square3Stack3dIcon } from '@/components/marketing/icons/square-3-stack-3d-icon'
import { pageMetadata } from '../seo'
import { StartFreeCallToAction } from '../start-free-cta'
import { productPages } from './pages'

export const metadata = pageMetadata({
  title: 'Product: AI cost tracking, budgets and keys for agencies and freelancers',
  description:
    'Everything in keyone: per-client AI cost tracking, budgets and limits, client reports, one key per client project, the controller and the tool catalog.',
  path: '/product',
})

export default function ProductIndexPage() {
  const cards = [
    ...productPages.map(p => ({ href: `/product/${p.slug}`, icon: p.icon, name: p.name, body: p.subheadline })),
    {
      href: '/catalog',
      icon: <Square3Stack3dIcon />,
      name: 'Catalog',
      body: 'Every tool a project key can call, with its models and prices: AI models and search APIs today, and more every month.',
    },
  ]

  return (
    <Main>
      <section className="py-16">
        <Container className="flex flex-col gap-10 sm:gap-16">
          <div className="flex max-w-3xl flex-col gap-6">
            <p className="text-sm/7 font-semibold text-olive-700 dark:text-olive-400">Product</p>
            <Heading>
              Run every client’s AI <span className="text-brand-green italic dark:text-brand-lime">from one place.</span>
            </Heading>
            <Text size="lg" className="max-w-2xl">
              <p>
                One account for your agency, one key per client project, and every call tracked, capped and ready to
                rebill.
              </p>
            </Text>
          </div>
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
            {cards.map(card => (
              <li key={card.href} className="flex">
                <a
                  href={card.href}
                  className="group flex flex-1 flex-col gap-3 rounded-xl bg-white p-6 ring-1 ring-olive-950/5 transition-shadow hover:shadow-lg hover:shadow-olive-950/5 dark:bg-white/5 dark:ring-white/10"
                >
                  <span className="flex size-10 items-center justify-center rounded-lg bg-brand-lime/20 text-brand-green dark:bg-brand-lime/15 dark:text-brand-lime">
                    {card.icon}
                  </span>
                  <h2 className="mt-2 font-display text-3xl/9 tracking-tight text-olive-950 dark:text-white">{card.name}</h2>
                  <p className="flex-1 text-sm/7 text-olive-700 dark:text-olive-400">{card.body}</p>
                  <span className="inline-flex items-center gap-2 text-sm/7 font-medium text-olive-950 dark:text-white">
                    Learn more <ArrowNarrowRightIcon className="transition-transform group-hover:translate-x-0.5" />
                  </span>
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
