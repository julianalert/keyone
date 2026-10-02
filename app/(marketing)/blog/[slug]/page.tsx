import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Main } from '@/components/marketing/elements/main'
import { GuideArticle } from '@/components/marketing/sections/guide-article'
import { formatGuideDate, type Guide } from '../../guides/guides'
import { pageMetadata, SITE_URL } from '../../seo'
import { StartFreeCallToAction } from '../../start-free-cta'
import { getPost, getPostSlugs } from '../posts'

// Every post is generated at build time from content/blog/*.md
export const dynamicParams = false

export function generateStaticParams() {
  return getPostSlugs().map(slug => ({ slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = getPost(params.slug)
  if (!post) return {}

  const metadata = pageMetadata({
    title: post.seoTitle ?? post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    openGraph: {
      title: post.title,
      type: 'article',
      publishedTime: post.published,
      modifiedTime: post.updated ?? post.published,
      authors: [post.author],
      section: 'Blog',
    },
  })
  return { ...metadata, twitter: { ...metadata.twitter, title: post.title } }
}

function structuredData(post: Guide) {
  const url = `${SITE_URL}/blog/${post.slug}`
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      datePublished: post.published,
      dateModified: post.updated ?? post.published,
      author: {
        '@type': 'Person',
        name: post.author,
        ...(post.authorRole && { jobTitle: post.authorRole }),
        ...(post.authorImage && { image: `${SITE_URL}${post.authorImage}` }),
      },
      publisher: { '@type': 'Organization', name: 'keyone', url: SITE_URL },
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
        { '@type': 'ListItem', position: 3, name: post.title, item: url },
      ],
    },
  ]
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug)
  if (!post) notFound()

  const date = post.updated ?? post.published

  return (
    <Main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData(post)).replace(/</g, '\\u003c') }}
      />
      <GuideArticle
        id="post"
        backLink={{ href: '/blog', label: 'Blog' }}
        headline={post.title}
        subheadline={<p>{post.description}</p>}
        meta={
          <>
            {post.authorImage && (
              <Image
                src={post.authorImage}
                alt=""
                width={80}
                height={80}
                className="size-10 shrink-0 rounded-full object-cover outline -outline-offset-1 outline-black/5 dark:outline-white/10"
              />
            )}
            <div className="flex flex-col">
              <span className="font-medium text-olive-950 dark:text-white">
                {post.author}
                {post.authorRole && <span className="font-normal text-olive-600 dark:text-olive-400">, {post.authorRole}</span>}
              </span>
              <span>
                {post.readingMinutes} min read · {post.updated ? 'Updated ' : ''}
                <time dateTime={date}>{formatGuideDate(date)}</time>
              </span>
            </div>
          </>
        }
        toc={post.toc}
        html={post.html}
      />
      <StartFreeCallToAction />
    </Main>
  )
}
