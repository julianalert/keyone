import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from '../../_og/og-card'
import { getStory, getStorySlugs } from '../stories'

export function generateStaticParams() {
  return getStorySlugs().map(slug => ({ slug }))
}

export function generateImageMetadata({ params }: { params: { slug: string } }) {
  const story = getStory(params.slug)
  return [{ id: 'card', alt: story?.title ?? 'keyone customer story', size: OG_SIZE, contentType: OG_CONTENT_TYPE }]
}

export default function Image({ params }: { params: { slug: string } }) {
  const story = getStory(params.slug)
  return ogCard({
    eyebrow: 'Customer story',
    title: story?.title ?? 'keyone customer stories',
    footer: story?.fields.company ? `${story.fields.company} · ${story.fields.industry ?? ''}` : undefined,
  })
}
