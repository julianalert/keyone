import { Container } from '@/components/marketing/elements/container'
import { Heading } from '@/components/marketing/elements/heading'
import { Main } from '@/components/marketing/elements/main'
import { Text } from '@/components/marketing/elements/text'
import { pageMetadata } from '../seo'
import { StartFreeCallToAction } from '../start-free-cta'
import { UseCaseGrid } from './use-case-grid'

export const metadata = pageMetadata({
  title: 'Use cases: who keyone is for',
  description:
    'keyone is for anyone who runs AI for clients: AI automation agencies, marketing agencies, freelancers and consultants, dev shops. One key per client project, budgets enforced, a report per client.',
  path: '/use-cases',
})

export default function UseCasesIndexPage() {
  return (
    <Main>
      <section className="py-16">
        <Container className="flex flex-col gap-10 sm:gap-16">
          <div className="flex max-w-3xl flex-col gap-6">
            <p className="text-sm/7 font-semibold text-olive-700 dark:text-olive-400">Use cases</p>
            <Heading>
              Built for anyone who runs AI <span className="text-brand-green italic dark:text-brand-lime">for clients.</span>
            </Heading>
            <Text size="lg" className="max-w-2xl">
              <p>
                An agency of twenty or a freelancer with two clients, on n8n, Make or a codebase: the shape is the same.
                You pay the providers, your clients get the work, and you need to know what each one cost. Pick the
                page that sounds like you.
              </p>
            </Text>
          </div>
          <UseCaseGrid headingLevel="h2" />
          <p className="text-sm/7 text-olive-500">
            Something else?{' '}
            <a href="/demo" className="font-medium text-olive-950 underline underline-offset-4 dark:text-white">
              Book a 30-minute call
            </a>{' '}
            and tell us how you run AI for clients.
          </p>
        </Container>
      </section>
      <StartFreeCallToAction />
    </Main>
  )
}
