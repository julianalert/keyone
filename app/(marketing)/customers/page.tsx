import { Container } from '@/components/marketing/elements/container'
import { Heading } from '@/components/marketing/elements/heading'
import { Main } from '@/components/marketing/elements/main'
import { Text } from '@/components/marketing/elements/text'
import { GuideGrid } from '../guides/guide-card'
import { pageMetadata } from '../seo'
import { StartFreeCallToAction } from '../start-free-cta'
import { getAllStories } from './stories'

export const metadata = pageMetadata({
  title: 'Customer stories',
  description: 'How agencies use keyone to run AI for their clients: the challenge they had, how they set it up, and what changed.',
  path: '/customers',
})

export default function CustomersPage() {
  const stories = getAllStories()

  return (
    <Main>
      <section className="py-16">
        <Container className="flex flex-col gap-10 sm:gap-16">
          <div className="flex max-w-2xl flex-col gap-6">
            <Heading>Customer stories</Heading>
            <Text size="lg" className="flex flex-col gap-4">
              <p>How agencies use keyone to run AI for their clients: the challenge, the setup, and what changed.</p>
            </Text>
          </div>
          <GuideGrid guides={stories} basePath="/customers" />
        </Container>
      </section>
      <StartFreeCallToAction />
    </Main>
  )
}
