import type { Metadata } from 'next'
import { Container } from '@/components/marketing/elements/container'
import { Heading } from '@/components/marketing/elements/heading'
import { Main } from '@/components/marketing/elements/main'
import { Text } from '@/components/marketing/elements/text'
import { StartFreeCallToAction } from '../start-free-cta'
import { GuideGrid } from './guide-card'
import { getAllGuides } from './guides'
import { pageMetadata } from '../seo'

export const metadata: Metadata = pageMetadata({
  title: 'Guides for agencies running AI for clients',
  description:
    'Practical guides for agencies running AI for their clients: tracking AI costs per client, billing usage and managing API keys.',
  path: '/guides',
})

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

          <GuideGrid guides={guides} />
        </Container>
      </section>
      <StartFreeCallToAction />
    </Main>
  )
}
