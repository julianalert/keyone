import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Main } from '@/components/marketing/elements/main'
import { CheckmarkIcon } from '@/components/marketing/icons/checkmark-icon'
import { GuideArticle } from '@/components/marketing/sections/guide-article'
import { TestimonialLargeQuote } from '@/components/marketing/sections/testimonial-with-large-quote'
import { formatGuideDate, type Guide } from '../../guides/guides'
import { pageMetadata, SITE_URL } from '../../seo'
import { StartFreeCallToAction } from '../../start-free-cta'
import { getStory, getStorySlugs } from '../stories'

// Every story is generated at build time from content/customers/*.md
export const dynamicParams = false

export function generateStaticParams() {
  return getStorySlugs().map(slug => ({ slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const story = getStory(params.slug)
  if (!story) return {}

  const metadata = pageMetadata({
    title: story.seoTitle ?? story.title,
    description: story.description,
    path: `/customers/${story.slug}`,
    openGraph: { title: story.title, type: 'article', publishedTime: story.published, section: 'Customer stories' },
  })
  return { ...metadata, twitter: { ...metadata.twitter, title: story.title } }
}

// "At a glance": who the customer is, what they use, and the results in three lines
function AtAGlance({ story }: { story: Guide }) {
  const f = story.fields
  const facts = [
    { label: 'Company', value: f.company },
    { label: 'Industry', value: f.industry },
    { label: 'Based in', value: f.location },
    { label: 'Team', value: f.team },
    { label: 'Clients', value: f.clients },
    { label: 'Uses', value: f.uses },
  ].filter(fact => fact.value)
  const highlights = (f.highlights ?? '').split('|').map(h => h.trim()).filter(Boolean)

  return (
    <section className="overflow-hidden rounded-xl bg-white ring-1 ring-olive-950/10 dark:bg-white/5 dark:ring-white/10">
      <div className="px-6 pt-6 sm:px-8">
        <p className="text-sm/7 font-semibold text-brand-green dark:text-brand-lime">At a glance</p>
      </div>
      <dl className="grid grid-cols-1 gap-x-8 gap-y-4 px-6 py-4 text-sm/7 sm:grid-cols-2 sm:px-8">
        {facts.map(fact => (
          <div key={fact.label}>
            <dt className="text-olive-500">{fact.label}</dt>
            <dd className="font-medium text-olive-950 dark:text-white">
              {fact.label === 'Company' && f.website ? (
                <a href={f.website} target="_blank" rel="noopener noreferrer" className="underline decoration-brand-lime underline-offset-4">
                  {fact.value}
                </a>
              ) : (
                fact.value
              )}
            </dd>
          </div>
        ))}
      </dl>
      {highlights.length > 0 && (
        <ul className="flex flex-col gap-3 border-t border-olive-950/10 bg-olive-950/2.5 px-6 py-5 text-sm/6 text-olive-950 sm:px-8 dark:border-white/10 dark:bg-white/5 dark:text-white">
          {highlights.map(h => (
            <li key={h} className="flex items-start gap-3">
              <CheckmarkIcon className="mt-1.5 shrink-0 text-brand-green dark:text-brand-lime" />
              {h}
            </li>
          ))}
        </ul>
      )}
      {f.disclosure && (
        <p className="border-t border-olive-950/10 px-6 py-4 text-sm/6 text-olive-600 sm:px-8 dark:border-white/10 dark:text-olive-400">
          {f.disclosure}
        </p>
      )}
    </section>
  )
}

export default function CustomerStoryPage({ params }: { params: { slug: string } }) {
  const story = getStory(params.slug)
  if (!story) notFound()

  const f = story.fields

  return (
    <Main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              '@context': 'https://schema.org',
              '@type': 'Article',
              headline: story.title,
              description: story.description,
              datePublished: story.published,
              dateModified: story.updated ?? story.published,
              author: { '@type': 'Organization', name: 'keyone', url: SITE_URL },
              publisher: { '@type': 'Organization', name: 'keyone', url: SITE_URL },
              about: { '@type': 'Organization', name: f.company, ...(f.website && { url: f.website }) },
              mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/customers/${story.slug}` },
            },
            {
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
                { '@type': 'ListItem', position: 2, name: 'Customer stories', item: `${SITE_URL}/customers` },
                { '@type': 'ListItem', position: 3, name: f.company ?? story.title, item: `${SITE_URL}/customers/${story.slug}` },
              ],
            },
          ]).replace(/</g, '\\u003c'),
        }}
      />
      <GuideArticle
        id="story"
        backLink={{ href: '/customers', label: 'Customer stories' }}
        eyebrow={f.company && f.industry ? `${f.company} · ${f.industry}` : f.company}
        headline={story.title}
        subheadline={<p>{story.description}</p>}
        meta={
          <span>
            Customer story · {story.readingMinutes} min read ·{' '}
            <time dateTime={story.published}>{formatGuideDate(story.published)}</time>
          </span>
        }
        toc={story.toc}
        lead={<AtAGlance story={story} />}
        html={story.html}
      />

      {f.quote && (
        <TestimonialLargeQuote
          id="quote"
          quote={<p>{f.quote}</p>}
          img={story.authorImage ? <Image src={story.authorImage} alt="" width={96} height={96} /> : null}
          name={story.author}
          byline={story.authorRole}
        />
      )}

      <StartFreeCallToAction />
    </Main>
  )
}
