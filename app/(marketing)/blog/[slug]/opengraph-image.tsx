import { OG_CONTENT_TYPE, OG_SIZE, ogCard, ogCoverCard } from '../../_og/og-card'
import { getPost, getPostSlugs } from '../posts'

export function generateStaticParams() {
  return getPostSlugs().map(slug => ({ slug }))
}

export function generateImageMetadata({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug)
  return [{ id: 'card', alt: post?.title ?? 'keyone blog', size: OG_SIZE, contentType: OG_CONTENT_TYPE }]
}

export default function Image({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug)
  const footer = post ? `By ${post.author} · ${post.readingMinutes} min read` : undefined
  // A post with a thumbnail shares it, with the title over its empty left side
  if (post?.image) return ogCoverCard({ image: post.image, eyebrow: 'Blog', title: post.title, footer })

  const [title, accent] = (post?.title ?? 'keyone blog').split(/:\s+/, 2)
  return ogCard({
    eyebrow: 'Blog',
    title: accent ? `${title}:` : title,
    accent,
    footer,
  })
}
