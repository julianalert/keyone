import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from '../../_og/og-card'
import { getUseCase, useCases } from '../use-cases'

export function generateStaticParams() {
  return useCases.map(page => ({ slug: page.slug }))
}

export function generateImageMetadata({ params }: { params: { slug: string } }) {
  const page = getUseCase(params.slug)
  return [{ id: 'card', alt: page ? `keyone for ${page.audience}: ${page.tagline}` : 'keyone', size: OG_SIZE, contentType: OG_CONTENT_TYPE }]
}

export default function Image({ params }: { params: { slug: string } }) {
  const page = getUseCase(params.slug)
  return ogCard({
    eyebrow: page ? `For ${page.audience}` : 'Use cases',
    title: page?.headline ?? 'keyone',
    accent: page?.accent,
    footer: page?.tagline,
  })
}
