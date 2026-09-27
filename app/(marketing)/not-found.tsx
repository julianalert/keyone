import type { Metadata } from 'next'
import { ButtonLink, PlainButtonLink } from '@/components/marketing/elements/button'
import { Container } from '@/components/marketing/elements/container'
import { Heading } from '@/components/marketing/elements/heading'
import { Main } from '@/components/marketing/elements/main'
import { Text } from '@/components/marketing/elements/text'
import { ArrowNarrowRightIcon } from '@/components/marketing/icons/arrow-narrow-right-icon'
import { getAllGuides } from './guides/guides'

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  const guides = getAllGuides()

  return (
    <Main>
      <section className="py-24">
        <Container className="flex flex-col items-start gap-6">
          <p className="text-sm/7 font-semibold text-brand-green dark:text-brand-lime">404</p>
          <Heading>This page doesn’t exist.</Heading>
          <Text size="lg" className="max-w-2xl">
            <p>The link may be broken or the page may have moved. These are a good place to start:</p>
          </Text>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <ButtonLink href="/" size="lg">
              Back to home
            </ButtonLink>
            <PlainButtonLink href="/guides" size="lg">
              Read the guides <ArrowNarrowRightIcon />
            </PlainButtonLink>
          </div>
          <ul className="mt-6 flex flex-col gap-3 text-sm/7">
            {guides.map(guide => (
              <li key={guide.slug}>
                <a
                  href={`/guides/${guide.slug}`}
                  className="font-medium text-olive-950 underline decoration-brand-lime underline-offset-4 dark:text-white"
                >
                  {guide.title}
                </a>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </Main>
  )
}
