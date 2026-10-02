import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from '../../_og/og-card'
import { getProductPage, productPages } from '../pages'

export function generateStaticParams() {
  return productPages.map(page => ({ slug: page.slug }))
}

export function generateImageMetadata({ params }: { params: { slug: string } }) {
  const page = getProductPage(params.slug)
  return [{ id: 'card', alt: page ? `keyone ${page.name}: ${page.tagline}` : 'keyone', size: OG_SIZE, contentType: OG_CONTENT_TYPE }]
}

export default function Image({ params }: { params: { slug: string } }) {
  const page = getProductPage(params.slug)
  return ogCard({
    eyebrow: page?.name ?? 'Product',
    title: page?.headline ?? 'keyone',
    accent: page?.accent,
    footer: page?.tagline,
  })
}
