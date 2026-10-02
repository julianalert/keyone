import { Container } from '@/components/marketing/elements/container'
import { Heading } from '@/components/marketing/elements/heading'
import { Main } from '@/components/marketing/elements/main'
import { Text } from '@/components/marketing/elements/text'
import { GuideGrid } from '../guides/guide-card'
import { pageMetadata } from '../seo'
import { StartFreeCallToAction } from '../start-free-cta'
import { getAllPosts } from './posts'

export const metadata = pageMetadata({
  title: 'Blog',
  description: 'Notes from the keyone team on running AI for clients: what we believe, what we are building and why.',
  path: '/blog',
})

export default function BlogPage() {
  const posts = getAllPosts()

  return (
    <Main>
      <section className="py-16">
        <Container className="flex flex-col gap-10 sm:gap-16">
          <div className="flex max-w-2xl flex-col gap-6">
            <Heading>Blog</Heading>
            <Text size="lg" className="flex flex-col gap-4">
              <p>Notes from the keyone team on running AI for clients: what we believe, what we are building and why.</p>
            </Text>
          </div>
          <GuideGrid guides={posts} basePath="/blog" />
        </Container>
      </section>
      <StartFreeCallToAction />
    </Main>
  )
}
