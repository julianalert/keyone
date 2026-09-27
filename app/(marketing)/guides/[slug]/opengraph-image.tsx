import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from '../../_og/og-card'
import { getGuide, getGuideSlugs } from '../guides'

export function generateStaticParams() {
  return getGuideSlugs().map(slug => ({ slug }))
}

// Per-guide alt text for the share image
export function generateImageMetadata({ params }: { params: { slug: string } }) {
  const guide = getGuide(params.slug)
  return [{ id: 'card', alt: guide?.title ?? 'keyone guide', size: OG_SIZE, contentType: OG_CONTENT_TYPE }]
}

export default function Image({ params }: { params: { slug: string } }) {
  const guide = getGuide(params.slug)
  // "How to Track AI Costs per Client: A Practical Guide for Agencies" → headline + green italic accent
  const [title, accent] = (guide?.title ?? 'keyone guides').split(/:\s+/, 2)
  return ogCard({
    eyebrow: 'Guide',
    title: accent ? `${title}:` : title,
    accent,
    footer: guide ? `By ${guide.author} · ${guide.readingMinutes} min read` : undefined,
  })
}
