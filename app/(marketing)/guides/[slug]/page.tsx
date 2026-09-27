import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Main } from '@/components/marketing/elements/main'
import { GuideArticle } from '@/components/marketing/sections/guide-article'
import { pageMetadata, SITE_URL } from '../../seo'
import { StartFreeCallToAction } from '../../start-free-cta'
import { formatGuideDate, getGuide, getGuideSlugs, type Guide } from '../guides'

// Every guide is generated at build time from content/guides/*.md
export const dynamicParams = false

export function generateStaticParams() {
  return getGuideSlugs().map(slug => ({ slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const guide = getGuide(params.slug)
  if (!guide) return {}

  return pageMetadata({
    title: guide.title,
    description: guide.description,
    path: `/guides/${guide.slug}`,
    openGraph: {
      type: 'article',
      publishedTime: guide.published,
      modifiedTime: guide.updated ?? guide.published,
      authors: [guide.author],
      section: 'Guides',
    },
  })
}

function structuredData(guide: Guide) {
  const site = SITE_URL
  const url = `${site}/guides/${guide.slug}`
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: guide.title,
      description: guide.description,
      datePublished: guide.published,
      dateModified: guide.updated ?? guide.published,
      author: guide.author === 'Keyone'
        ? { '@type': 'Organization', name: 'keyone', url: site }
        : { '@type': 'Person', name: guide.author, ...(guide.authorImage && { image: `${site}${guide.authorImage}` }) },
      publisher: { '@type': 'Organization', name: 'keyone', url: site },
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      timeRequired: `PT${guide.readingMinutes}M`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: site },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: `${site}/guides` },
        { '@type': 'ListItem', position: 3, name: guide.title, item: url },
      ],
    },
  ]
}

export default function GuidePage({ params }: { params: { slug: string } }) {
  const guide = getGuide(params.slug)
  if (!guide) notFound()

  const date = guide.updated ?? guide.published

  return (
    <Main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData(guide)).replace(/</g, '\\u003c') }}
      />
      <GuideArticle
        id="guide"
        backLink={{ href: '/guides', label: 'All guides' }}
        headline={guide.title}
        subheadline={<p>{guide.description}</p>}
        meta={
          <>
            {guide.authorImage ? (
              <Image
                src={guide.authorImage}
                alt=""
                width={80}
                height={80}
                className="size-10 shrink-0 rounded-full object-cover outline -outline-offset-1 outline-black/5 dark:outline-white/10"
              />
            ) : (
              <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-olive-950 font-display text-xl text-white dark:bg-white dark:text-olive-950"
              >
                {guide.author.charAt(0).toLowerCase()}
              </span>
            )}
            <div className="flex flex-col">
              <span className="font-medium text-olive-950 dark:text-white">By {guide.author}</span>
              <span>
                {guide.readingMinutes} min read · {guide.updated ? 'Updated ' : ''}
                <time dateTime={date}>{formatGuideDate(date)}</time>
              </span>
            </div>
          </>
        }
        toc={guide.toc}
        html={guide.html}
      />
      <StartFreeCallToAction />
    </Main>
  )
}
